const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// List of common words to ignore in fallback search
const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'your', 'have', 'been', 'was', 'were', 'has', 'had', 'are', 'not', 'get', 'got', 'did', 'does', 'back', 'take', 'put', 'she', 'they', 'our', 'what', 'who', 'how', 'why', 'can', 'will', 'any', 'some', 'one', 'out', 'into', 'upon']);

const STOPWORDS_ES = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u', 'pero', 'si', 'no', 'que', 'en', 'de', 'del', 'al', 'con', 'por', 'para', 'a', 'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'es', 'son', 'fue', 'fueron', 'ser', 'estar']);

async function fetchWordData(word) {
  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const data = response.data;
    let usage = null;
    let definition = null;

    if (Array.isArray(data) && data.length > 0) {
      for (const entry of data) {
        if (entry.meanings) {
          for (const meaning of entry.meanings) {
            if (meaning.definitions) {
              for (const def of meaning.definitions) {
                if (!definition) definition = def.definition;
                if (def.example) {
                  usage = def.example;
                  break;
                }
              }
            }
            if (usage) break;
          }
        }
        if (usage) break;
      }
    }
    return { found: true, usage, definition };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { found: false, usage: null, definition: null };
    }
    throw error;
  }
}

async function fetchSpanishWordData(word) {
  try {
    const response = await axios.get(`https://es.wiktionary.org/w/api.php`, {
        params: {
            action: 'query',
            prop: 'revisions',
            rvprop: 'content',
            titles: word,
            format: 'json',
            redirects: true
        }
    });

    const pages = response.data.query?.pages;
    if (!pages) return { found: false };

    const pageId = Object.keys(pages)[0];
    if (pageId === '-1') return { found: false }; // Not found

    const content = pages[pageId].revisions?.[0]?.['*'];
    if (!content) return { found: false };

    // Extract example
    // Look for {{ejemplo|...}}
    const exampleMatch = content.match(/\{\{ejemplo\|([^}|]+)(?:\|[^}]*)?\}\}/i);
    let usage = null;
    if (exampleMatch) {
        usage = exampleMatch[1].trim();
        if (usage.startsWith('1=')) {
            usage = usage.substring(2).trim();
        }
    }

    return { found: true, usage, definition: null };
  } catch (error) {
    console.error("Error fetching Spanish data:", error);
    return { found: false, usage: null };
  }
}

app.get('/api/usage', async (req, res) => {
  const originalWord = req.query.word;
  const lang = req.query.lang || 'en'; // Default to English
  
  if (!originalWord) {
    return res.status(400).json({ error: 'Word parameter is required' });
  }

  // Clean the input
  const cleanWord = originalWord.trim().replace(/[.,!?;:~]$/, '');
  console.log(`Received request for: "${cleanWord}" (lang: ${lang})`);

  try {
    const fetchFunc = lang === 'es' ? fetchSpanishWordData : fetchWordData;
    const stopWords = lang === 'es' ? STOPWORDS_ES : STOPWORDS;

    // 1. Try exact match
    const result = await fetchFunc(cleanWord);

    if (result.found && result.usage) {
      console.log(`Found usage for "${cleanWord}"`);
      return res.json({ usage: result.usage });
    }

    // 2. If no usage found, and input has spaces, try splitting
    if (cleanWord.includes(' ')) {
      console.log(`No usage for phrase "${cleanWord}". Trying split words...`);
      const words = cleanWord.split(/\s+/)
        .map(w => w.replace(/[.,!?;:~]$/, ''))
        .filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
        .sort((a, b) => b.length - a.length); // Try longest words first

      for (const word of words) {
        const subResult = await fetchFunc(word);
        if (subResult.found && subResult.usage) {
          console.log(`Found fallback usage for word "${word}"`);
          return res.json({ usage: `(Example for '${word}'): ${subResult.usage}` });
        }
      }
    }

    // 3. Fallback to definition of the whole phrase (English only mostly as we didn't implement def parsing for ES)
    if (result.found && result.definition) {
      console.log(`Found definition only for "${cleanWord}"`);
      return res.json({ usage: `(Definition): ${result.definition}` });
    }

    // 4. Fallback to definition of sub-words (English only)
    if (cleanWord.includes(' ') && lang !== 'es') {
      const words = cleanWord.split(/\s+/)
        .map(w => w.replace(/[.,!?;:~]$/, ''))
        .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
        .sort((a, b) => b.length - a.length);

      for (const word of words) {
        const subResult = await fetchFunc(word);
        if (subResult.found && subResult.definition) {
          console.log(`Found fallback definition for word "${word}"`);
          return res.json({ usage: `(Definition for '${word}'): ${subResult.definition}` });
        }
      }
    }

    console.log(`No usage or definition found for "${cleanWord}"`);
    res.json({ usage: null, message: 'No usage example found.' });

  } catch (error) {
    console.error('Server error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
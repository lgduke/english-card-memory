const axios = require('axios');

// List of common words to ignore in fallback search
const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'your', 'have', 'been', 'was', 'were', 'has', 'had', 'are', 'not', 'get', 'got', 'did', 'does', 'back', 'take', 'put', 'she', 'they', 'our', 'what', 'who', 'how', 'why', 'can', 'will', 'any', 'some', 'one', 'out', 'into', 'upon']);

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

module.exports = async (req, res) => {
  const originalWord = req.query.word;
  if (!originalWord) {
    return res.status(400).json({ error: 'Word parameter is required' });
  }

  // Clean the input
  const cleanWord = originalWord.trim().replace(/[.,!?;:~]$/, '');
  console.log(`Received request for: "${cleanWord}"`);

  try {
    // 1. Try exact match
    const result = await fetchWordData(cleanWord);

    if (result.found && result.usage) {
      console.log(`Found usage for "${cleanWord}"`);
      return res.json({ usage: result.usage });
    }

    // 2. If no usage found, and input has spaces, try splitting
    if (cleanWord.includes(' ')) {
      console.log(`No usage for phrase "${cleanWord}". Trying split words...`);
      const words = cleanWord.split(/\s+/)
        .map(w => w.replace(/[.,!?;:~]$/, ''))
        .filter(w => w.length > 2 && !STOPWORDS.has(w.toLowerCase()))
        .sort((a, b) => b.length - a.length); // Try longest words first

      for (const word of words) {
        const subResult = await fetchWordData(word);
        if (subResult.found && subResult.usage) {
          console.log(`Found fallback usage for word "${word}"`);
          return res.json({ usage: `(Example for '${word}'): ${subResult.usage}` });
        }
      }
    }

    // 3. Fallback to definition of the whole phrase
    if (result.found && result.definition) {
      console.log(`Found definition only for "${cleanWord}"`);
      return res.json({ usage: `(Definition): ${result.definition}` });
    }

    // 4. Fallback to definition of sub-words
    if (cleanWord.includes(' ')) {
      const words = cleanWord.split(/\s+/)
        .map(w => w.replace(/[.,!?;:~]$/, ''))
        .filter(w => w.length > 3 && !STOPWORDS.has(w.toLowerCase()))
        .sort((a, b) => b.length - a.length);

      for (const word of words) {
        const subResult = await fetchWordData(word);
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
};

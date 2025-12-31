import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css';

interface Word {
  englishSentence: string;
  koreanMeaning: string;
  memo: string;
}

function App() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<'eng-to-kor' | 'kor-to-eng'>('eng-to-kor');
  const [usage, setUsage] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Should-memory.csv');

  useEffect(() => {
    Papa.parse(`/${fileName}`, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const mappedWords: Word[] = data.map(row => {
          return {
            englishSentence: row['내가 모은 영어 문장'] || '',
            koreanMeaning: row['한글 뜻'] || '',
            memo: row['메모'] || '',
          };
        }).filter(word => word.englishSentence && word.koreanMeaning);
        setWords(mappedWords);
        if (mappedWords.length > 0) {
          const randomIndex = Math.floor(Math.random() * mappedWords.length);
          setCurrentWord(mappedWords[randomIndex]);
        }
      }
    });
  }, [fileName]);

  const showNextWord = () => {
    if (words.length > 0) {
      const randomIndex = Math.floor(Math.random() * words.length);
      setCurrentWord(words[randomIndex]);
      setIsFlipped(false);
      setUsage(''); // Clear usage for the word
    }
  };

  const handleFindUsage = async () => {
    if (!currentWord) return;

    // Clean the phrase: trim whitespace and remove common trailing characters.
    const wordOrPhrase = currentWord.englishSentence.trim().replace(/ ~$/, '').trim();
    
    // Prevent searching for what is already a long sentence.
    if (wordOrPhrase.split(' ').length > 5) {
      setUsage("This appears to be a full sentence already, so a usage example cannot be looked up.");
      return;
    }

    setUsage('Searching for usage examples...');
    
    try {
      const response = await fetch(`/api/usage?word=${encodeURIComponent(wordOrPhrase)}`);
      if (!response.ok) {
        // Try to get a more specific error message from the server's JSON response
        const errorData = await response.json().catch(() => null); // Catch cases where body is not JSON
        const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (data.usage) {
        setUsage(data.usage);
      } else {
        setUsage('No usage example found.');
      }
    } catch (error: any) {
      console.error("Failed to fetch usage:", error);
      setUsage(`Failed to fetch usage example: ${error.message}`);
    }
  };

  const flipCard = () => {
    setIsFlipped(true);
  };

  const switchMode = () => {
    setMode(prevMode => prevMode === 'eng-to-kor' ? 'kor-to-eng' : 'eng-to-kor');
    setIsFlipped(false);
  };

  const getCardFront = () => {
    if (!currentWord) return '';
    return mode === 'eng-to-kor' ? currentWord.englishSentence : currentWord.koreanMeaning;
  };

  const getCardBack = () => {
    if (!currentWord) return '';
    const answer = mode === 'eng-to-kor' ? currentWord.koreanMeaning : currentWord.englishSentence;
    return (
      <>
        <p>{answer}</p>
      </>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="file-selector" style={{ marginBottom: '20px' }}>
          <label htmlFor="file-select" style={{ marginRight: '10px' }}>Choose Data File: </label>
          <select 
            id="file-select" 
            value={fileName} 
            onChange={(e) => setFileName(e.target.value)}
            style={{ padding: '5px', fontSize: '16px' }}
          >
            <option value="Should-memory.csv">Should-memory.csv</option>
            <option value="Should-memory-V2.csv">Should-memory-V2.csv</option>
          </select>
        </div>
        <h1>English Card Memory Program</h1>
        {words.length > 0 && currentWord ? (
          <div className="flashcard-container">
            {isFlipped && (
              <div className="question-display">
                <p>{getCardFront()}</p>
              </div>
            )}
            <div className={`flashcard ${isFlipped ? 'is-flipped' : ''}`}>
              <div className="flashcard-front">
                <p>{getCardFront()}</p>
              </div>
              <div className="flashcard-back">
                {getCardBack()}
              </div>
            </div>
            {isFlipped && usage && (
              <div className="usage-box">
                <p>Usage:</p>
                <p>{usage}</p>
              </div>
            )}
            {isFlipped && currentWord.memo && (
              <div className="memo-display">
                <p>Memo: {currentWord.memo}</p>
              </div>
            )}
            <div className="controls">
              {!isFlipped ? (
                <button onClick={flipCard}>Show Answer</button>
              ) : (
                <>
                  <button onClick={handleFindUsage}>Find Usage</button>
                  <button onClick={showNextWord}>Next Word</button>
                </>
              )}
              <button onClick={switchMode}>
                Switch to {mode === 'eng-to-kor' ? 'Korean to English' : 'English to Korean'}
              </button>
            </div>
          </div>
        ) : (
          <p>Loading words...</p>
        )}
      </header>
    </div>
  );
}

export default App;


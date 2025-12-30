const axios = require('axios');

async function test() {
  try {
    const word = 'control freak';
    console.log(`Fetching: ${word}`);
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error(error.message);
  }
}

test();

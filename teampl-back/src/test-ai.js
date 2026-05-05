const axios = require('axios');

async function test() {
  try {
    console.log("Testing Ollama connection...");
    const response = await axios.post('http://host.docker.internal:11434/api/chat', {
      model: 'llama3:latest',
      messages: [{ role: 'user', content: 'Say hello in one word.' }],
      stream: false
    }, { timeout: 30000 });
    console.log("Response:", response.data.message.content);
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) console.error("Response data:", err.response.data);
  }
}

test();

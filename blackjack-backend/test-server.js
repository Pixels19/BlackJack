// test_server.js
const express = require('express');
const app = express();
const TEST_PORT = 3006; // Use a very unique port

app.get('/', (req, res) => {
  res.send('Test server is running!');
});

app.listen(TEST_PORT, () => {
  console.log(`Test server listening on http://localhost:${TEST_PORT}`);
}).on('error', (err) => {
  console.error('Test server error:', err.message);
  process.exit(1);
});
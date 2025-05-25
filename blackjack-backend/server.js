// server.js

// Import the express library
const express = require('express');
// Create an instance of the express application
const app = express();
// Define the port the server will listen on
const PORT = process.env.PORT || 3001; // You can change this back to 3001 if 5000 was in use

console.log('--- Starting server.js script ---');

// Middleware: This line tells Express to parse incoming JSON requests.
app.use(express.json());
console.log('JSON middleware applied.');

// --- Route 1: GET Request ---
app.get('/api/status', (req, res) => {
  console.log('GET /api/status request received');
  res.json({
    message: 'Blackjack Backend is running!',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
});
console.log('/api/status route defined.');

// --- Route 2: POST Request ---
app.post('/api/data', (req, res) => {
  console.log('POST /api/data request received');
  const receivedData = req.body;
  console.log('Received data:', receivedData);
  res.json({
    message: 'Data received successfully!',
    yourData: receivedData,
    status: 'success'
  });
});
console.log('/api/data route defined.');

// --- Blackjack Tip Route: GET Shuffled Deck ---
app.get('/api/deck/shuffle', (req, res) => {
  console.log('GET /api/deck/shuffle request received');
  const deckId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  res.json({
    success: true,
    deck_id: deckId,
    remaining: 52,
    shuffled: true,
    message: 'A new deck has been shuffled!'
  });
});
console.log('/api/deck/shuffle route defined.');

// Start the server and listen for incoming requests
// Added a .on('error') handler to catch port binding issues explicitly
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access status at http://localhost:${PORT}/api/status`);
  console.log(`Test POST at http://localhost:${PORT}/api/data`);
  console.log(`Get a shuffled deck at http://localhost:${PORT}/api/deck/shuffle`);
}).on('error', (err) => {
  // This will catch errors like EADDRINUSE (port already in use)
  console.error(`ERROR: Server failed to start on port ${PORT}:`, err.message);
  if (err.code === 'EADDRINUSE') {
    console.error('This means the port is already in use. Try changing the PORT variable in server.js');
  }
  process.exit(1); // Exit the process with an error code
});

console.log('Attempting to start server...');
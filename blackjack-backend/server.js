// blackjack-backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Required for frontend to talk to backend

// Import your Mongoose models (if you need them directly in server.js, though usually routes handle this)
// const Player = require('./models/Player'); // Only if you need Player model directly in server.js

// Import your route files
const playerRoutes = require('./players'); // Import the new player routes (no 'routes' folder)
const gameRoutes = require('./game');     // Import the game routes (no 'routes' folder)

const app = express();
const PORT = process.env.PORT || 3001; // Backend will listen on port 3001

// Use environment variable for deployment, fallback to local for development
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blackjack_db?authSource=admin';

// Middleware
app.use(cors()); // Enable CORS for all origins (for development)
app.use(express.json()); // To parse JSON request bodies

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- API Routes ---
// Use the imported route files
// All routes defined in players.js will now be accessible under /api/players
app.use('/api/players', playerRoutes);
// All routes defined in game.js will now be accessible under /api/game
app.use('/api/game', gameRoutes);

// Basic route for root (optional)
app.get('/', (req, res) => {
    res.send('Blackjack Backend API is running!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
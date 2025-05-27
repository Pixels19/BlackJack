// blackjack-backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import the cors middleware

const app = express();
const PORT = process.env.PORT || 3001; // Backend server port
// IMPORTANT: For Docker Compose, the MONGODB_URI should use the service name 'mongodb'
// from your docker-compose.yml, not 'localhost'.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/blackjack_db';

// --- Middleware ---
// Parse JSON request bodies
app.use(express.json());
// Enable CORS for all origins. This is necessary for your frontend (on a different port)
// to make requests to your backend.
app.use(cors());

// --- Database Connection ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schema and Model for Player ---
// Define the schema for a player
const playerSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    chips: { type: Number, required: true, default: 1000 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 }
}, { timestamps: true }); // Add timestamps for creation/update tracking

// Create the Player model from the schema
const Player = mongoose.model('Player', playerSchema);

// --- API Routes ---

// GET /api/players - Get all players
app.get('/api/players', async (req, res) => {
    try {
        const players = await Player.find();
        res.json(players);
    } catch (err) {
        // Send 500 status for server errors
        res.status(500).json({ message: err.message });
    }
});

// POST /api/players - Add a new player
app.post('/api/players', async (req, res) => {
    // Basic validation for request body
    if (!req.body.username || typeof req.body.username !== 'string') {
        return res.status(400).json({ message: 'Username is required and must be a string.' });
    }
    if (req.body.chips !== undefined && (typeof req.body.chips !== 'number' || req.body.chips < 0)) {
        return res.status(400).json({ message: 'Chips must be a non-negative number.' });
    }

    const player = new Player({
        username: req.body.username,
        chips: req.body.chips || 1000 // Default to 1000 if not provided
    });

    try {
        const newPlayer = await player.save();
        // Send 201 status for successful creation
        res.status(201).json({ message: 'Player added successfully', player: newPlayer });
    } catch (err) {
        // Handle duplicate username error (MongoDB error code 11000 for duplicate key)
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Username already exists.' });
        }
        // Other validation errors or server errors
        res.status(400).json({ message: err.message });
    }
});

// GET /api/players/:username - Get a specific player by username
app.get('/api/players/:username', async (req, res) => {
    try {
        const player = await Player.findOne({ username: req.params.username });
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }
        res.json(player);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/players/:username', async (req, res) => {
    try {
        const player = await Player.findOne({ username: req.params.username });
        if (!player) {
            return res.status(404).json({ message: 'Player not found' });
        }

        // Only update provided fields
        if (req.body.chips !== undefined) {
            if (typeof req.body.chips !== 'number' || req.body.chips < 0) {
                return res.status(400).json({ message: 'Chips must be a non-negative number.' });
            }
            player.chips = req.body.chips;
        }
        if (req.body.wins !== undefined) {
            if (typeof req.body.wins !== 'number' || req.body.wins < 0) {
                return res.status(400).json({ message: 'Wins must be a non-negative number.' });
            }
            player.wins = req.body.wins;
        }
        if (req.body.losses !== undefined) {
            if (typeof req.body.losses !== 'number' || req.body.losses < 0) {
                return res.status(400).json({ message: 'Losses must be a non-negative number.' });
            }
            player.losses = req.body.losses;
        }

        // --- ADD THESE TWO LINES ---
        const updatedPlayer = await player.save(); // Save the changes to the database
        res.json({ message: 'Player updated successfully', player: updatedPlayer }); // Send success response
        // --- END ADDED LINES ---

    } catch (err) {
        // This catch block handles errors during findOne, save, or validation
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/players/:username - Delete a player
app.delete('/api/players/:username', async (req, res) => {
    try {
        const result = await Player.deleteOne({ username: req.params.username });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Player not found' });
        }
        res.json({ message: 'Player deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
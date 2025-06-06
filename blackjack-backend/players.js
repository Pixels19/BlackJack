// blackjack-backend/routes/players.js

const express = require('express');
const router = express.Router(); // Create a new router object
const Player = require('./Player'); // Import your Player model (adjust path if needed)

// GET all players
router.get('/', async (req, res) => {
    try {
        const players = await Player.find();
        res.status(200).json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ message: 'Server error fetching players.' });
    }
});

// POST a new player
router.post('/', async (req, res) => {
    try {
        const { username, chips } = req.body;
        // Basic validation
        if (!username || typeof chips === 'undefined') {
            return res.status(400).json({ message: 'Username and chips are required.' });
        }
        if (typeof chips !== 'number' || chips < 0) {
            return res.status(400).json({ message: 'Chips must be a non-negative number.' });
        }

        const newPlayer = new Player({ username, chips });
        await newPlayer.save();
        res.status(201).json({ message: 'Player added successfully', player: newPlayer });
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error (username unique)
            return res.status(409).json({ message: 'Username already exists.' });
        }
        console.error('Error adding player:', error);
        res.status(500).json({ message: 'Server error adding player.' });
    }
});

// GET a single player by username (optional, but good for specific reads)
router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const player = await Player.findOne({ username: username });
        if (!player) {
            return res.status(404).json({ message: 'Player not found.' });
        }
        res.status(200).json(player);
    } catch (error) {
        console.error('Error fetching player by username:', error);
        res.status(500).json({ message: 'Server error fetching player.' });
    }
});

// PUT/PATCH update player chips by username
router.put('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { chips } = req.body;

        if (typeof chips !== 'number' || chips < 0) {
            return res.status(400).json({ message: 'Chips must be a non-negative number.' });
        }

        const updatedPlayer = await Player.findOneAndUpdate(
            { username: username }, // Find by username
            { chips: chips },      // Update chips
            { new: true }          // Return the updated document
        );

        if (!updatedPlayer) {
            return res.status(404).json({ message: 'Player not found.' });
        }

        res.status(200).json({ message: 'Player chips updated successfully', player: updatedPlayer });
    } catch (error) {
        console.error('Error updating player chips:', error);
        res.status(500).json({ message: 'Server error updating player chips.' });
    }
});

// DELETE a player by username
router.delete('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const deletedPlayer = await Player.findOneAndDelete({ username: username });

        if (!deletedPlayer) {
            return res.status(404).json({ message: 'Player not found.' });
        }

        res.status(200).json({ message: 'Player deleted successfully', player: deletedPlayer });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ message: 'Server error deleting player.' });
    }
});

module.exports = router; // Export the router

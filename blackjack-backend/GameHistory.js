// blackjack-backend/GameHistory.js

const mongoose = require('mongoose');

const gameHistorySchema = new mongoose.Schema({
    playerId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the Player model's _id
        ref: 'Player', // This tells Mongoose this field refers to the 'Player' model
        required: true
    },
    username: { // Storing username directly for easier display without extra lookups
        type: String,
        required: true
    },
    betAmount: {
        type: Number,
        required: true
    },
    playerHand: { // Store the final hand
        type: Array,
        required: true
    },
    dealerHand: { // Store the final hand
        type: Array,
        required: true
    },
    playerScore: {
        type: Number,
        required: true
    },
    dealerScore: {
        type: Number,
        required: true
    },
    outcome: { // e.g., 'player_win', 'dealer_win', 'push', 'player_bust', 'dealer_bust'
        type: String,
        required: true
    },
    chipsChange: { // How many chips the player won/lost in this game
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); // Add timestamps option for createdAt/updatedAt

module.exports = mongoose.model('GameHistory', gameHistorySchema);
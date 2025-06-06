// blackjack-backend/game.js

const express = require('express');
const router = express.Router();
const Player = require('./Player'); // Correct path: Player.js is in the same directory
const GameHistory = require('./GameHistory'); // Correct path: GameHistory.js is in the same directory

// --- Helper Functions ---

// Function to create a standard 52-card deck
const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣']; // Spades, Hearts, Diamonds, Clubs
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    // Shuffle the deck (Fisher-Yates algorithm)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
    }
    return deck;
};

// Function to calculate hand score (handles Aces as 1 or 11)
const calculateHandScore = (hand) => {
    let score = 0;
    let numAces = 0;

    for (const card of hand) {
        if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
            score += 10;
        } else if (card.rank === 'A') {
            numAces += 1;
            score += 11; // Assume 11 initially
        } else {
            score += parseInt(card.rank);
        }
    }

    // Adjust for Aces if score is over 21
    while (score > 21 && numAces > 0) {
        score -= 10; // Change Ace from 11 to 1
        numAces -= 1;
    }
    return score;
};

// Function to deal a single card from the deck
const dealCard = (deck) => {
    if (deck.length === 0) {
        console.warn("Deck is empty!");
        return { rank: 'EMPTY', suit: 'DECK' }; // Or throw an error
    }
    return deck.pop();
};

// --- Global Game State (for simplicity, one game at a time) ---
let currentGameState = null;

// --- API Routes ---

// POST /api/game/start - Start a new Blackjack game
router.post('/start', async (req, res) => {
    try {
        const { playerId, betAmount } = req.body;

        // Basic input validation
        if (!playerId || typeof betAmount !== 'number' || betAmount <= 0) {
            return res.status(400).json({ message: 'Player ID and a positive bet amount are required.' });
        }

        // Fetch player from DB to check chips
        const player = await Player.findById(playerId);
        if (!player) {
            return res.status(404).json({ message: 'Player not found.' });
        }
        if (player.chips < betAmount) {
            return res.status(400).json({ message: 'Not enough chips to place this bet.' });
        }

        // Initialize game
        const deck = createDeck();
        const playerHand = [dealCard(deck), dealCard(deck)];
        const dealerHand = [dealCard(deck), dealCard(deck)];

        currentGameState = {
            playerId: playerId,
            username: player.username, // Store username for history
            playerHand: playerHand,
            dealerHand: dealerHand,
            playerScore: calculateHandScore(playerHand),
            dealerScore: calculateHandScore(dealerHand),
            deck: deck, // Remaining deck
            betAmount: betAmount,
            status: 'playing' // Initial status
        };

        // Check for immediate Blackjack
        if (currentGameState.playerScore === 21) {
            currentGameState.dealerScore = calculateHandScore(currentGameState.dealerHand); // Reveal dealer's second card
            let chipsChange = 0;
            let message = '';

            if (currentGameState.dealerScore === 21) {
                currentGameState.status = 'push';
                message = 'Both have Blackjack! Push!';
                chipsChange = 0;
            } else {
                currentGameState.status = 'player_win';
                message = 'Blackjack! Player wins!';
                chipsChange = currentGameState.betAmount * 1.5;
            }

            player.chips += chipsChange;
            await player.save();

            await GameHistory.create({
                playerId: currentGameState.playerId,
                username: currentGameState.username,
                betAmount: currentGameState.betAmount,
                playerHand: currentGameState.playerHand,
                dealerHand: currentGameState.dealerHand,
                playerScore: currentGameState.playerScore,
                dealerScore: currentGameState.dealerScore,
                outcome: currentGameState.status,
                chipsChange: chipsChange
            });

            // Capture state before nulling
            const finalGameStateForResponse = { ...currentGameState };
            currentGameState = null; // Reset game state after immediate outcome

            res.status(200).json({
                message: message,
                gameState: {
                    playerHand: finalGameStateForResponse.playerHand,
                    dealerHand: finalGameStateForResponse.dealerHand, // Show full dealer hand
                    playerScore: finalGameStateForResponse.playerScore,
                    dealerScore: finalGameStateForResponse.dealerScore,
                    status: finalGameStateForResponse.status
                }
            });
            return; // Exit after handling immediate Blackjack
        }

        // Send back only visible dealer card for initial state if game is still playing
        const visibleDealerHand = [dealerHand[0], { rank: '?', suit: '?' }]; // Mask second card

        res.status(200).json({
            message: 'Game started!',
            gameState: {
                playerHand: currentGameState.playerHand,
                dealerHand: visibleDealerHand, // Only show one dealer card
                playerScore: currentGameState.playerScore,
                dealerScore: calculateHandScore([dealerHand[0]]), // Only score visible card
                status: currentGameState.status
            }
        });

    } catch (error) {
        console.error('Error starting game:', error);
        res.status(500).json({ message: 'Server error starting game.' });
    }
});

// POST /api/game/hit - Player hits
router.post('/hit', async (req, res) => {
    try {
        if (!currentGameState || currentGameState.status !== 'playing') {
            return res.status(400).json({ message: 'No active game or game is over.' });
        }

        const newCard = dealCard(currentGameState.deck);
        currentGameState.playerHand.push(newCard);
        currentGameState.playerScore = calculateHandScore(currentGameState.playerHand);

        let outcomeMessage = 'Player hits!';
        let chipsChange = 0;

        if (currentGameState.playerScore > 21) {
            currentGameState.status = 'player_bust';
            outcomeMessage = 'Player busts! Dealer wins.';
            chipsChange = -currentGameState.betAmount;

            const player = await Player.findById(currentGameState.playerId);
            if (player) {
                player.chips += chipsChange;
                await player.save();

                await GameHistory.create({
                    playerId: currentGameState.playerId,
                    username: player.username,
                    betAmount: currentGameState.betAmount,
                    playerHand: currentGameState.playerHand,
                    dealerHand: currentGameState.dealerHand, // Full dealer hand for history
                    playerScore: currentGameState.playerScore,
                    dealerScore: calculateHandScore(currentGameState.dealerHand), // Full dealer score for history
                    outcome: 'player_bust',
                    chipsChange: chipsChange
                });
            }
            // --- FIX START: Capture state before nulling ---
            const finalGameStateForResponse = { ...currentGameState }; // Capture the state
            currentGameState = null; // Reset game state after bust
            // --- FIX END ---

            res.status(200).json({
                message: outcomeMessage,
                gameState: {
                    playerHand: finalGameStateForResponse.playerHand,
                    dealerHand: finalGameStateForResponse.dealerHand, // Show full dealer hand on bust
                    playerScore: finalGameStateForResponse.playerScore,
                    dealerScore: finalGameStateForResponse.dealerScore, // Use final dealer score
                    status: finalGameStateForResponse.status
                }
            });
            return; // Exit early if game ended
        }

        // If game is still playing, send partial dealer hand
        const visibleDealerHand = [currentGameState.dealerHand[0], { rank: '?', suit: '?' }];
        const visibleDealerScore = calculateHandScore([currentGameState.dealerHand[0]]);

        res.status(200).json({
            message: outcomeMessage,
            gameState: {
                playerHand: currentGameState.playerHand,
                dealerHand: visibleDealerHand,
                playerScore: currentGameState.playerScore,
                dealerScore: visibleDealerScore,
                status: currentGameState.status
            }
        });

    } catch (error) {
        console.error('Error handling hit:', error);
        res.status(500).json({ message: 'Server error handling hit.' });
    }
});

// POST /api/game/stand - Player stands
router.post('/stand', async (req, res) => {
    try {
        if (!currentGameState || currentGameState.status !== 'playing') {
            return res.status(400).json({ message: 'No active game or game is over.' });
        }

        // Dealer's turn logic
        while (calculateHandScore(currentGameState.dealerHand) < 17) {
            const newCard = dealCard(currentGameState.deck);
            currentGameState.dealerHand.push(newCard);
        }
        currentGameState.dealerScore = calculateHandScore(currentGameState.dealerHand); // Final dealer score

        // Determine winner
        let outcomeMessage = '';
        let playerChipsChange = 0;

        if (currentGameState.playerScore > 21) { // Player already busted (should be caught by hit, but as fallback)
            currentGameState.status = 'player_bust';
            outcomeMessage = 'Player busts! Dealer wins.';
            playerChipsChange = -currentGameState.betAmount;
        } else if (currentGameState.dealerScore > 21) {
            currentGameState.status = 'dealer_bust';
            outcomeMessage = 'Dealer busts! Player wins.';
            playerChipsChange = currentGameState.betAmount;
        } else if (currentGameState.playerScore > currentGameState.dealerScore) {
            currentGameState.status = 'player_win';
            outcomeMessage = 'Player wins!';
            playerChipsChange = currentGameState.betAmount;
        } else if (currentGameState.dealerScore > currentGameState.playerScore) {
            currentGameState.status = 'dealer_win';
            outcomeMessage = 'Dealer wins!';
            playerChipsChange = -currentGameState.betAmount;
        } else {
            currentGameState.status = 'push';
            outcomeMessage = 'Push!';
            playerChipsChange = 0;
        }

        // Update player chips in DB
        const player = await Player.findById(currentGameState.playerId);
        if (player) {
            player.chips += playerChipsChange;
            await player.save();

            // Save Game History
            await GameHistory.create({
                playerId: currentGameState.playerId,
                username: player.username,
                betAmount: currentGameState.betAmount,
                playerHand: currentGameState.playerHand,
                dealerHand: currentGameState.dealerHand,
                playerScore: currentGameState.playerScore,
                dealerScore: currentGameState.dealerScore,
                outcome: currentGameState.status,
                chipsChange: playerChipsChange
            });
        }

        // --- FIX START: Capture state before nulling ---
        const finalGameStateForResponse = { ...currentGameState }; // Capture the state
        currentGameState = null; // Reset game state after game ends
        // --- FIX END ---

        res.status(200).json({
            message: outcomeMessage,
            gameState: {
                playerHand: finalGameStateForResponse.playerHand,
                dealerHand: finalGameStateForResponse.dealerHand, // Show full dealer hand now
                playerScore: finalGameStateForResponse.playerScore,
                dealerScore: finalGameStateForResponse.dealerScore,
                status: finalGameStateForResponse.status,
                playerChipsChange: playerChipsChange
            }
        });

    } catch (error) {
        console.error('Error handling stand:', error);
        res.status(500).json({ message: 'Server error handling stand.' });
    }
});

// GET /api/game/history/:playerId - Get game history for a specific player
router.get('/history/:playerId', async (req, res) => {
    try {
        const { playerId } = req.params;
        const history = await GameHistory.find({ playerId: playerId })
                                        .sort({ timestamp: -1 })
                                        .limit(50);

        res.status(200).json(history);
    } catch (error) {
        console.error('Error fetching game history:', error);
        res.status(500).json({ message: 'Server error fetching game history.' });
    }
});

module.exports = router;
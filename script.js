// script.js

// Import data and functions from data.js
import { bankroll, userStats, getBankroll, setBankroll, loadBankroll, loadUserStats, saveUserStats, calculateWinRatio } from './data.js';

// --- Deck of Cards API Variables ---
const DECK_API_BASE_URL = 'https://deckofcardsapi.com/api/deck/';
let deckId = null; // Stores the ID of the current shuffled deck

// --- UI Element References ---
let playersActionsSection;
let bettingSection;
let bankrollDisplaySpan;
let usersWagerInput;
let betButton;

// References for displaying cards
let dealerCardsUl;
let playerCardsUl;

// --- Helper Functions ---

/**
 * Updates the bankroll display span with the current bankroll value.
 */
function updateBankrollDisplay() {
    if (bankrollDisplaySpan) {
        bankrollDisplaySpan.textContent = `$${getBankroll()}`;
    }
}

/**
 * Renders a card image to a specified unordered list (UL) element.
 * @param {HTMLUListElement} ulElement - The UL element to append the card to.
 * @param {Object} card - The card object from the API response.
 */
function renderCard(ulElement, card) {
    const li = document.createElement('li');
    li.classList.add('p-1', 'rounded-md', 'flex-shrink-0'); // Tailwind classes for styling
    const img = document.createElement('img');
    img.src = card.image;
    img.alt = `${card.value} of ${card.suit}`;
    img.classList.add('w-24', 'h-32', 'rounded-md', 'shadow-md'); // Tailwind classes for image size/style
    li.appendChild(img);
    ulElement.appendChild(li);
}

/**
 * Clears all cards from the dealer's and player's hands.
 */
function clearCards() {
    if (dealerCardsUl) dealerCardsUl.innerHTML = '';
    if (playerCardsUl) playerCardsUl.innerHTML = '';
}

// --- API Interaction Functions ---

/**
 * Shuffles a new deck of cards and stores its ID.
 */
async function shuffleNewDeck() {
    try {
        const response = await fetch(`${DECK_API_BASE_URL}new/shuffle/?deck_count=1`);
        const data = await response.json();
        if (data.success) {
            deckId = data.deck_id;
            console.log("New deck shuffled. Deck ID:", deckId);
        } else {
            console.error("Failed to shuffle new deck:", data.error);
            // Fallback: if API fails, reset deckId to null to force re-shuffle attempt
            deckId = null;
        }
    } catch (error) {
        console.error("Error shuffling deck:", error);
        deckId = null;
    }
}

/**
 * Draws a specified number of cards from the current deck.
 * @param {number} count - The number of cards to draw.
 * @returns {Promise<Array>} A promise that resolves with an array of card objects.
 */
async function drawCards(count) {
    if (!deckId) {
        console.warn("No deck ID available. Attempting to shuffle a new deck...");
        await shuffleNewDeck(); // Try to shuffle if no deck ID
        if (!deckId) {
            console.error("Still no deck ID after shuffle attempt. Cannot draw cards.");
            return []; // If still no deck ID, return empty
        }
    }
    try {
        const response = await fetch(`${DECK_API_BASE_URL}${deckId}/draw/?count=${count}`);
        const data = await response.json();
        if (data.success) {
            return data.cards;
        } else {
            console.error("Failed to draw cards:", data.error);
            return [];
        }
    } catch (error) {
        console.error("Error drawing cards:", error);
        return [];
    }
}

// --- Game Phase Control Functions ---

/**
 * Transitions the game to the betting phase.
 * Hides the #playersActions section and displays the #betting section.
 */
function timeToBet() {
    console.log("Transitioning to betting phase...");
    if (playersActionsSection && bettingSection) {
        playersActionsSection.classList.add('hidden');
        bettingSection.classList.remove('hidden');
        updateBankrollDisplay();
        usersWagerInput.value = ''; // Clear previous wager
    } else {
        console.error("Required sections not found for timeToBet.");
    }
}

/**
 * Determines a placeholder game outcome (win or loss) and updates stats/bankroll.
 * In a real game, this would involve card logic.
 * @param {number} wager - The amount the user bet for this round.
 */
function determineGameOutcome(wager) {
    // Placeholder: 50/50 chance of win/loss
    const isWin = Math.random() < 0.5;

    if (isWin) {
        userStats.wins++;
        setBankroll(getBankroll() + wager);
        console.log(`You won $${wager}! New bankroll: $${getBankroll()}`);
        alert(`You won $${wager}!`);
    } else {
        userStats.losses++;
        setBankroll(getBankroll() - wager);
        console.log(`You lost $${wager}. New bankroll: $${getBankroll()}`);
        alert(`You lost $${wager}.`);
    }

    saveUserStats(); // Save updated stats after outcome
    // After a short delay, go back to betting phase
    setTimeout(() => {
        clearCards(); // Clear cards before next round
        timeToBet();
    }, 2000); // Wait 2 seconds before prompting for next bet
}

/**
 * Handles the user's wager.
 * Logs the wager amount and transitions to the playing phase.
 */
async function makeWager() {
    if (usersWagerInput) {
        const wager = parseInt(usersWagerInput.value);

        // --- Input Validation ---
        if (isNaN(wager) || wager <= 0) {
            alert("Please enter a valid positive number for your wager.");
            console.warn("Invalid wager amount. Please enter a positive number.");
            return;
        }

        if (wager > getBankroll()) {
            alert(`Insufficient funds. Your bankroll is $${getBankroll()}. You tried to bet $${wager}.`);
            console.warn(`Insufficient funds. Your bankroll is $${getBankroll()}. You tried to bet $${wager}.`);
            return;
        }

        // --- Update User Stats related to betting (before the actual game outcome) ---
        // userStats.gamesPlayed is incremented in determineGameOutcome now
        userStats.totalWagered += wager;
        saveUserStats(); // Save immediately to reflect total wagered

        console.log(`User wagered: $${wager}`);

        timeToPlay(); // Transition to the playing phase

        // --- Draw and Display Cards using API ---
        console.log("Drawing cards...");
        const dealerHand = await drawCards(2);
        const playerHand = await drawCards(2);

        dealerHand.forEach(card => renderCard(dealerCardsUl, card));
        playerCardsUl.innerHTML = ''; // Clear existing list items before rendering
        playerHand.forEach(card => renderCard(playerCardsUl, card));

        // Immediately determine outcome (for this placeholder logic)
        // In a real game, this would happen AFTER player actions (hit/stand)
        determineGameOutcome(wager);
    } else {
        console.error("Wager input not found for makeWager.");
    }
}

/**
 * Transitions the game to the playing phase.
 * Displays the #playersActions section and hides the #betting section.
 */
function timeToPlay() {
    console.log("Transitioning to playing phase...");
    if (playersActionsSection && bettingSection) {
        bettingSection.classList.add('hidden');
        playersActionsSection.classList.remove('hidden');
    } else {
        console.error("Required sections not found for timeToPlay.");
    }
}

// --- Initialize on DOM Content Loaded ---
document.addEventListener('DOMContentLoaded', async () => {
    // Get references to all necessary DOM elements
    playersActionsSection = document.getElementById('playersActions');
    bettingSection = document.getElementById('betting');
    bankrollDisplaySpan = document.getElementById('bankrollDisplay');
    usersWagerInput = document.getElementById('users-wager');
    betButton = document.getElementById('betButton');

    // Get references for card display elements
    dealerCardsUl = document.querySelector('.dealer-cards ul');
    playerCardsUl = document.querySelector('.players-cards ul');

    // Attach event listener to the Bet button
    if (betButton) {
        betButton.addEventListener('click', makeWager);
    } else {
        console.error("Bet button not found.");
    }

    // Load bankroll and user stats from localStorage
    loadBankroll(); // Loads the bankroll value
    loadUserStats(); // Loads user stats (including nickname)

    // Shuffle a new deck when the page loads
    await shuffleNewDeck();

    // Start the game in the betting phase
    timeToBet(); // This will call updateBankrollDisplay()
});
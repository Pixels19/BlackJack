// script.js

// --- Global Data Model ---
let bankroll = 2022; // Initialize the player's bankroll to their luck year

/**
 * Gets the current value of the player's bankroll.
 * @returns {number} The current bankroll balance.
 */
function getBankroll() {
    return bankroll;
}

/**
 * Sets the new balance for the player's bankroll.
 * Ensures the new balance is an integer.
 * @param {number} newBalance - The new balance to assign.
 */
function setBankroll(newBalance) {
    // As a pretend online casino, we only deal in whole dollars (integers)
    bankroll = Math.floor(newBalance);
    // Update the display immediately when the bankroll changes
    updateBankrollDisplay();
}

// --- UI Element References ---
let playersActionsSection;
let bettingSection;
let bankrollDisplaySpan;
let usersWagerInput;
let betButton;

// --- Helper Function to Update Bankroll Display ---
/**
 * Updates the bankroll display span with the current bankroll value.
 */
function updateBankrollDisplay() {
    if (bankrollDisplaySpan) {
        bankrollDisplaySpan.textContent = `$${getBankroll()}`;
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
        playersActionsSection.classList.add('hidden'); // Hide player actions
        bettingSection.classList.remove('hidden');    // Display betting interface
        updateBankrollDisplay(); // Ensure bankroll is updated when betting starts
    } else {
        console.error("Required sections not found for timeToBet.");
    }
}

/**
 * Handles the user's wager.
 * Logs the wager amount and transitions to the playing phase.
 */
function makeWager() {
    if (usersWagerInput) {
        const wager = parseInt(usersWagerInput.value); // Get wager as an integer
        if (isNaN(wager) || wager <= 0) {
            console.warn("Invalid wager amount. Please enter a positive number.");
            // Optionally, display a message to the user in the UI
            return;
        }

        if (wager > getBankroll()) {
            console.warn(`Insufficient funds. Your bankroll is $${getBankroll()}. You tried to bet $${wager}.`);
            // Optionally, display a message to the user in the UI
            return;
        }

        // For now, we just log and transition. In a real game, you'd deduct the wager.
        console.log(`User wagered: $${wager}`);
        // setBankroll(getBankroll() - wager); // Uncomment this line when you want to deduct the wager

        timeToPlay(); // Transition to the playing phase
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
        bettingSection.classList.add('hidden');     // Hide betting interface
        playersActionsSection.classList.remove('hidden'); // Display player actions
    } else {
        console.error("Required sections not found for timeToPlay.");
    }
}

// --- Initialize on DOM Content Loaded ---
document.addEventListener('DOMContentLoaded', () => {
    // Get references to all necessary DOM elements
    playersActionsSection = document.getElementById('playersActions');
    bettingSection = document.getElementById('betting');
    bankrollDisplaySpan = document.getElementById('bankrollDisplay');
    usersWagerInput = document.getElementById('users-wager');
    betButton = document.getElementById('betButton');

    // Attach event listener to the Bet button
    if (betButton) {
        betButton.addEventListener('click', makeWager);
    } else {
        console.error("Bet button not found.");
    }

    // Initialize the bankroll display and start the game in the betting phase
    setBankroll(2022); // This will also call updateBankrollDisplay()
    timeToBet();
});
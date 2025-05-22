// index.js

// Import data and functions from data.js
import { userStats, loadUserStats, saveUserStats, setNickname, calculateWinRatio } from './data.js';

// UI Element References for Stats
let gamesPlayedSpan;
let totalWageredSpan;
let winsSpan;
let lossesSpan;
let winRatioSpan;
let nicknameDisplaySpan; // New: for displaying nickname
let welcomeNicknameSpan; // New: for welcome message nickname

// UI Element References for Nickname Input
let nicknameInput;
let saveNicknameButton;

/**
 * Updates all user statistics display spans on the home page.
 */
function updateStatsDisplay() {
    if (gamesPlayedSpan) {
        gamesPlayedSpan.textContent = userStats.gamesPlayed;
    }
    if (totalWageredSpan) {
        totalWageredSpan.textContent = `$${userStats.totalWagered}`;
    }
    if (winsSpan) {
        winsSpan.textContent = userStats.wins;
    }
    if (lossesSpan) {
        lossesSpan.textContent = userStats.losses;
    }
    if (winRatioSpan) {
        winRatioSpan.textContent = calculateWinRatio();
    }
    if (nicknameDisplaySpan) {
        nicknameDisplaySpan.textContent = userStats.nickname;
    }
    if (welcomeNicknameSpan) {
        welcomeNicknameSpan.textContent = userStats.nickname;
    }
    // Set input value to current nickname if it exists
    if (nicknameInput) {
        nicknameInput.value = userStats.nickname;
    }
}

/**
 * Handles saving the user's nickname.
 */
function handleSaveNickname() {
    if (nicknameInput) {
        const newNickname = nicknameInput.value.trim();
        setNickname(newNickname); // Use the function from data.js
        updateStatsDisplay(); // Update display after saving
        alert(`Nickname saved as: ${userStats.nickname}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Get references for stats display elements
    gamesPlayedSpan = document.getElementById('gamesPlayed');
    totalWageredSpan = document.getElementById('totalWagered');
    winsSpan = document.getElementById('wins');
    lossesSpan = document.getElementById('losses');
    winRatioSpan = document.getElementById('winRatio');
    nicknameDisplaySpan = document.getElementById('nicknameDisplay');
    welcomeNicknameSpan = document.getElementById('welcomeNickname');

    // Get references for nickname input elements
    nicknameInput = document.getElementById('nicknameInput');
    saveNicknameButton = document.getElementById('saveNicknameButton');

    // Attach event listener for saving nickname
    if (saveNicknameButton) {
        saveNicknameButton.addEventListener('click', handleSaveNickname);
    }

    // Load user stats and update display on page load
    loadUserStats();
    updateStatsDisplay();

    // Original Start Playing Button logic (if still needed, otherwise remove)
    const startPlayingButton = document.getElementById('startPlayingButton');
    if (startPlayingButton) {
        startPlayingButton.addEventListener('click', () => {
            window.location.href = 'gaming-table.html';
        });
    } else {
        console.warn("Start Playing button not found on index.html");
    }
});
// data.js

// --- Global Data Model ---
export let bankroll = 2022; // Exported for other modules to read
export let userStats = {
    nickname: "Player", // New: Default nickname
    gamesPlayed: 0,
    totalWagered: 0,
    wins: 0,
    losses: 0
};

// --- LocalStorage Keys ---
const BANKROLL_STORAGE_KEY = 'blackjackBankroll';
const USER_STATS_STORAGE_KEY = 'blackjackUserStats';

// --- Data Model Functions ---
/**
 * Gets the current value of the player's bankroll.
 * @returns {number} The current bankroll balance.
 */
export function getBankroll() {
    return bankroll;
}

/**
 * Sets the new balance for the player's bankroll.
 * Ensures the new balance is an integer.
 * @param {number} newBalance - The new balance to assign.
 */
export function setBankroll(newBalance) {
    bankroll = Math.floor(newBalance);
    localStorage.setItem(BANKROLL_STORAGE_KEY, bankroll);
    // Note: updateBankrollDisplay will be called by the page-specific script
}

/**
 * Loads the bankroll from localStorage, or initializes if not found.
 */
export function loadBankroll() {
    const savedBankroll = localStorage.getItem(BANKROLL_STORAGE_KEY);
    if (savedBankroll !== null) {
        bankroll = parseInt(savedBankroll);
        if (isNaN(bankroll)) {
            bankroll = 2022;
        }
    } else {
        bankroll = 2022; // Initialize if no saved data
    }
}

/**
 * Loads user stats from localStorage, or initializes if not found.
 */
export function loadUserStats() {
    const savedStats = localStorage.getItem(USER_STATS_STORAGE_KEY);
    if (savedStats) {
        try {
            const parsedStats = JSON.parse(savedStats);
            // Merge loaded stats with default to ensure new stats are included
            userStats = { ...userStats, ...parsedStats };
        } catch (e) {
            console.error("Error parsing user stats from localStorage:", e);
            // If parse fails, use default stats
            userStats = { nickname: "Player", gamesPlayed: 0, totalWagered: 0, wins: 0, losses: 0 };
        }
    }
}

/**
 * Saves current user stats to localStorage.
 */
export function saveUserStats() {
    localStorage.setItem(USER_STATS_STORAGE_KEY, JSON.stringify(userStats));
}

/**
 * Calculates and returns the user's win ratio as a percentage.
 * Handles division by zero if no games have been played.
 * @returns {string} The win ratio formatted as a percentage string.
 */
export function calculateWinRatio() {
    if (userStats.gamesPlayed === 0) {
        return "N/A";
    }
    const ratio = (userStats.wins / userStats.gamesPlayed) * 100;
    return `${ratio.toFixed(1)}%`;
}

/**
 * Sets the user's nickname and saves it.
 * @param {string} newNickname - The new nickname for the user.
 */
export function setNickname(newNickname) {
    userStats.nickname = newNickname || "Player"; // Ensure it's not empty
    saveUserStats();
}
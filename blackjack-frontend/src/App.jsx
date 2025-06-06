// blackjack-frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css'; // Styling for the application

function App() {
  // --- State variables for Player Management ---
  const [players, setPlayers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newChips, setNewChips] = useState(1000); // Default chips for new player
  const [updateUsername, setUpdateUsername] = useState('');
  const [updateChips, setUpdateChips] = useState('');
  const [deleteUsername, setDeleteUsername] = useState('');
  const [message, setMessage] = useState(''); // For displaying general success/error messages

  // --- State variables for Game Logic ---
  const [currentGame, setCurrentGame] = useState(null); // Holds the current game state from backend
  const [selectedPlayerId, setSelectedPlayerId] = useState(''); // ID of the player currently selected for game/history
  const [betAmount, setBetAmount] = useState(10); // Default bet amount for new game

  // --- State variables for Game History ---
  const [gameHistory, setGameHistory] = useState([]); // To store fetched game history records

  // --- State variable for Tab Navigation ---
  const [activeTab, setActiveTab] = useState('managePlayers'); // Default to 'managePlayers' tab on load

  // --- Configuration for Backend API Base URL ---
  const API_BASE_URL = 'http://localhost:3001/api';

  // --- Function to fetch all players from the backend ---
  const fetchPlayers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/players`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error("Error fetching players:", error);
      setMessage(`Error fetching players: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  // --- Player Management Handlers (no changes to these) ---
  const handleAddPlayer = async (event) => { /* ... existing code ... */
    event.preventDefault();
    setMessage('Adding new player...');
    try {
      const response = await fetch(`${API_BASE_URL}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, chips: newChips }),
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.message || `HTTP error! status: ${response.status}`); }
      setMessage(`Player '${data.player.username}' added!`);
      setNewUsername('');
      setNewChips(1000);
      fetchPlayers();
    } catch (error) { console.error("Error adding player:", error); setMessage(`Error adding player: ${error.message}`); }
  };

  const handleUpdatePlayer = async (event) => { /* ... existing code ... */
    event.preventDefault();
    setMessage('Updating player...');
    try {
      const response = await fetch(`${API_BASE_URL}/players/${updateUsername}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chips: parseFloat(updateChips) }),
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.message || `HTTP error! status: ${response.status}`); }
      setMessage(`Player '${data.player.username}' updated!`);
      setUpdateUsername('');
      setUpdateChips('');
      fetchPlayers();
    } catch (error) { console.error("Error updating player:", error); setMessage(`Error updating player: ${error.message}`); }
  };

  const handleDeletePlayer = async (event) => { /* ... existing code ... */
    event.preventDefault();
    if (!window.confirm(`Are you sure you want to delete player '${deleteUsername}'?`)) { return; }
    setMessage(`Deleting player '${deleteUsername}'...`);
    try {
      const response = await fetch(`${API_BASE_URL}/players/${deleteUsername}`, { method: 'DELETE', });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.message || `HTTP error! status: ${response.status}`); }
      setMessage(`Player deleted: ${data.message}`);
      setDeleteUsername('');
      fetchPlayers();
    } catch (error) { console.error("Error deleting player:", error); setMessage(`Error deleting player: ${error.message}`); }
  };

  // --- Game Logic Handlers ---

  const handleStartGame = async (event) => {
    event.preventDefault();
    if (!selectedPlayerId) { setMessage('Please select a player to start the game.'); return; }
    if (betAmount <= 0) { setMessage('Bet amount must be positive.'); return; }

    setMessage('Starting game...');
    try {
      const response = await fetch(`${API_BASE_URL}/game/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: selectedPlayerId, betAmount: betAmount }),
      });
      const data = await response.json();

      if (!response.ok) { throw new Error(data.message || `HTTP error! status: ${response.status}`); }

      setCurrentGame(data.gameState);
      setMessage(data.message); // Set message (e.g., "Game started!" or "Blackjack! Player wins!")
      fetchPlayers(); // Refresh player chips
    } catch (error) {
      console.error("Error starting game:", error);
      setMessage(`Error starting game: ${error.message}`);
      setCurrentGame(null);
    }
  };

  const handleHit = async () => {
    if (!currentGame || currentGame.status !== 'playing') {
      setMessage('No active game to hit in.');
      return;
    }
    setMessage('Player hitting...');
    try {
      const response = await fetch(`${API_BASE_URL}/game/hit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* gameId or player ID if needed by your backend */ }),
      });
      const data = await response.json();

      if (!response.ok) { throw new Error(data.message || `HTTP error! status: ${response.status}`); }

      setCurrentGame(data.gameState);
      setMessage(data.message); // Update message (e.g., "Player busts!", "Player hits!")
      if (data.gameState.status !== 'playing') {
          fetchPlayers(); // Refresh chips if game ended
          // IMPORTANT: Do NOT set currentGame(null) here. Keep final game state visible.
      }
    } catch (error) {
      console.error("Error hitting:", error);
      setMessage(`Error hitting: ${error.message}`);
    }
  };

  const handleStand = async () => {
    if (!currentGame || currentGame.status !== 'playing') {
      setMessage('No active game to stand in.');
      return;
    }
    setMessage('Player standing...');
    try {
      const response = await fetch(`${API_BASE_URL}/game/stand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ /* gameId or player ID if needed by your backend */ }),
      });
      const data = await response.json();

      if (!response.ok) { throw new Error(data.message || `HTTP error! status: ${response.status}`); }

      setCurrentGame(data.gameState); // Update game state with final hands/scores/outcome
      setMessage(data.message); // Set the final outcome message (e.g., "Player wins!", "Dealer wins!")
      fetchPlayers(); // Always refresh player chips after stand (game ends)
      // IMPORTANT: Do NOT set currentGame(null) here. Keep final game state visible.
    } catch (error) {
      console.error("Error standing:", error);
      setMessage(`Error standing: ${error.message}`);
    }
  };

  // --- NEW: Function to reset game for "Play Again" button ---
  const handlePlayAgain = () => {
    setCurrentGame(null); // Clear the current game state to show "Start a new game"
    setMessage('Ready for a new game!'); // Set a new message to prompt for a new game
    // Optionally, you might want to reset selectedPlayerId or betAmount here too if desired
    // setSelectedPlayerId('');
    // setBetAmount(10);
  };

  // --- Game History Handler (no changes to this) ---
  const handleViewHistory = async () => { /* ... existing code ... */
    if (!selectedPlayerId) { setMessage('Please select a player to view history.'); return; }
    setMessage('Fetching game history...');
    try {
      const response = await fetch(`${API_BASE_URL}/game/history/${selectedPlayerId}`);
      if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
      const data = await response.json();
      setGameHistory(data);
      setMessage(`Game history loaded for selected player.`);
    } catch (error) { console.error("Error fetching game history:", error); setMessage(`Error fetching game history: ${error.message}`); setGameHistory([]); }
  };


  return (
    <div className="App">
      <h1>Blackjack Game Dashboard</h1>

      {/* Global message display: Shows general app messages, not game outcomes */}
      {message && !currentGame && <p className="global-message" style={{ color: message.includes('Error') ? 'red' : 'lightgreen' }}>{message}</p>}

      {/* --- Tab Navigation --- */}
      <div className="tabs">
        <button
          className={activeTab === 'managePlayers' ? 'active-tab' : ''}
          onClick={() => setActiveTab('managePlayers')}
        >
          Manage Players and Chips
        </button>
        <button
          className={activeTab === 'blackjackGame' ? 'active-tab' : ''}
          onClick={() => setActiveTab('blackjackGame')}
        >
          Blackjack Game Table
        </button>
        <button
          className={activeTab === 'gameHistory' ? 'active-tab' : ''}
          onClick={() => setActiveTab('gameHistory')}
        >
          Game History
        </button>
      </div>

      <hr />

      {/* --- Conditional Rendering for "Manage Players and Chips" Tab --- */}
      {activeTab === 'managePlayers' && (
        <div className="tab-content">
          <h2>Current Players</h2>
          {players.length === 0 ? (
            <p>No players found. Add one below!</p>
          ) : (
            <ul>
              {players.map(player => (
                <li key={player._id}>
                  <strong>{player.username}</strong>: {player.chips} chips
                </li>
              ))}
            </ul>
          )}

          <hr />

          {/* Add New Player Form */}
          <h2>Add New Player</h2>
          <form onSubmit={handleAddPlayer}>
            <div>
              <label htmlFor="newUsername">Username:</label>
              <input
                type="text"
                id="newUsername"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="newChips">Starting Chips:</label>
              <input
                type="number"
                id="newChips"
                value={newChips}
                onChange={(e) => setNewChips(parseFloat(e.target.value))}
                min="0"
                required
              />
            </div>
            <button type="submit">Add Player</button>
          </form>

          <hr />

          {/* Update Player Chips Form */}
          <h2>Update Player Chips</h2>
          <form onSubmit={handleUpdatePlayer}>
            <div>
              <label htmlFor="updateUsername">Username to Update:</label>
              <input
                type="text"
                id="updateUsername"
                value={updateUsername}
                onChange={(e) => setUpdateUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="updateChips">New Chips Amount:</label>
              <input
                type="number"
                id="updateChips"
                value={updateChips}
                onChange={(e) => setUpdateChips(parseFloat(e.target.value))}
                min="0"
                required
              />
            </div>
            <button type="submit">Update Chips</button>
          </form>

          <hr />

          {/* Delete Player Form */}
          <h2>Delete Player</h2>
          <form onSubmit={handleDeletePlayer}>
            <div>
              <label htmlFor="deleteUsername">Username to Delete:</label>
              <input
                type="text"
                id="deleteUsername"
                value={deleteUsername}
                onChange={(e) => setDeleteUsername(e.target.value)}
                required
              />
            </div>
            <button type="submit">Delete Player</button>
          </form>
        </div>
      )}

      {/* --- Conditional Rendering for "Blackjack Game Table" Tab --- */}
      {activeTab === 'blackjackGame' && (
        <div className="tab-content">
          {/* --- Start Game Form --- */}
          <h2>Start New Game</h2>
          <form onSubmit={handleStartGame}>
            <div>
              <label htmlFor="selectPlayer">Select Player:</label>
              <select
                id="selectPlayer"
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                required
              >
                <option value="">--Select a Player--</option>
                {players.map(player => (
                  <option key={player._id} value={player._id}>
                    {player.username} ({player.chips} chips)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="betAmount">Bet Amount:</label>
              <input
                type="number"
                id="betAmount"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min="1"
                required
              />
            </div>
            <button type="submit" disabled={!selectedPlayerId}>Start Game</button>
          </form>

          <hr />

          {/* --- Blackjack Game Area --- */}
          <h2>Blackjack Game</h2>

          {/* NEW: Game Outcome Message Display (only when game is not playing) */}
          {currentGame && currentGame.status !== 'playing' && (
            <p
              style={{
                fontWeight: 'bold',
                fontSize: '1.2em',
                // Determine color based on outcome
                color: (currentGame.status.includes('player_win') || currentGame.status.includes('dealer_bust')) ? 'lightgreen' :
                       (currentGame.status.includes('dealer_win') || currentGame.status.includes('player_bust')) ? 'red' :
                       'orange', // Neutral color for push
                marginTop: '10px',
                marginBottom: '10px',
                textAlign: 'center'
              }}
            >
              {message} {/* Display the message from the backend */}
            </p>
          )}

          {currentGame ? (
            <div>
              <h3>Player Hand ({currentGame.playerScore})</h3>
              <p className="card-display">
                {currentGame.playerHand.map((card, index) => (
                  <span key={index}>
                    {card.rank}{card.suit}
                  </span>
                ))}
              </p>

              <h3>Dealer Hand ({currentGame.dealerScore})</h3>
              <p className="card-display">
                {currentGame.dealerHand.map((card, index) => (
                  <span key={index}>
                    {card.rank}{card.suit}
                  </span>
                ))}
              </p>

              {currentGame.status === 'playing' && (
                <div>
                  <button onClick={handleHit}>Hit</button>
                  <button onClick={handleStand}>Stand</button>
                </div>
              )}
              {currentGame.status !== 'playing' && (
                  // Show Play Again button when game is over
                  <button onClick={handlePlayAgain}>Play Again</button>
              )}
            </div>
          ) : (
            <p>Start a new game to begin!</p>
          )}
        </div>
      )}

      {/* --- Conditional Rendering for "Game History" Tab --- */}
      {activeTab === 'gameHistory' && (
        <div className="tab-content">
          <h2>Game History</h2>
          <div>
            <label htmlFor="historyPlayerSelect">Select Player for History:</label>
            <select
              id="historyPlayerSelect"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
            >
              <option value="">--Select a Player--</option>
              {players.map(player => (
                <option key={player._id} value={player._id}>
                  {player.username}
                </option>
              ))}
            </select>
            <button onClick={handleViewHistory} disabled={!selectedPlayerId}>View History</button>
          </div>

          {gameHistory.length > 0 && (
            <div>
              <h3>History for {players.find(p => p._id === selectedPlayerId)?.username || 'Selected Player'}</h3>
              <ul>
                {gameHistory.map((game, index) => (
                  <li key={game._id || index}>
                    <p><strong>Outcome:</strong> {game.outcome.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Bet:</strong> {game.betAmount} chips</p>
                    <p><strong>Player Hand:</strong> {game.playerHand.map(card => `${card.rank}${card.suit}`).join(', ')} ({game.playerScore})</p>
                    <p><strong>Dealer Hand:</strong> {game.dealerHand.map(card => `${card.rank}${card.suit}`).join(', ')} ({game.dealerScore})</p>
                    <p><strong>Chips Change:</strong> {game.chipsChange > 0 ? `+${game.chipsChange}` : game.chipsChange} chips</p>
                    <p><strong>Date:</strong> {new Date(game.timestamp).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {gameHistory.length === 0 && selectedPlayerId && (
              <p>No game history found for this player.</p>
          )}
          {gameHistory.length === 0 && !selectedPlayerId && (
              <p>Select a player and click "View History" to see their game history.</p>
          )}
        </div>
      )}

      <hr />

      {/* Optional: Add a button to refresh players manually - kept outside tabs for easy access */}
      <button onClick={fetchPlayers}>Refresh Player List</button>
    </div>
  );
}

export default App;
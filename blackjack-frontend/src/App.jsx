// blackjack-frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css'; // Keep default Vite/React styling or replace as needed

function App() {
  const [players, setPlayers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newChips, setNewChips] = useState(1000); // Default chips for new player
  const [updateUsername, setUpdateUsername] = useState('');
  const [updateChips, setUpdateChips] = useState('');
  const [message, setMessage] = useState(''); // For displaying success/error messages

  // --- Configuration for Backend URL ---
  // When running the frontend in your browser (localhost:5173),
  // the browser directly makes API calls to your backend (localhost:3001).
  // The 'backend' service name is for inter-container communication only.
  const API_BASE_URL = 'http://localhost:3001/api';

  // --- Function to fetch all players ---
  const fetchPlayers = async () => {
    try {
      setMessage('Fetching players...');
      const response = await fetch(`${API_BASE_URL}/players`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`); // Corrected: removed "new" keyword before Error
      }
      const data = await response.json();
      setPlayers(data);
      setMessage('Players loaded successfully!');
    } catch (error) {
      console.error("Error fetching players:", error);
      setMessage(`Error fetching players: ${error.message}`);
    }
  };

  // Fetch players when the component mounts
  useEffect(() => {
    fetchPlayers();
  }, []); // Empty dependency array means this runs once on mount

  // --- Function to add a new player ---
  const handleAddPlayer = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setMessage('Adding new player...');
    try {
      const response = await fetch(`${API_BASE_URL}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newUsername, chips: newChips }),
      });

      const data = await response.json(); // Parse response data

      if (!response.ok) {
        // Handle HTTP errors or backend errors
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      setMessage(`Player '${data.player.username}' added!`);
      setNewUsername(''); // Clear form fields
      setNewChips(1000);
      fetchPlayers(); // Refresh the player list
    } catch (error) {
      console.error("Error adding player:", error);
      setMessage(`Error adding player: ${error.message}`);
    }
  };

  // --- Function to update player chips ---
  const handleUpdatePlayer = async (event) => {
    event.preventDefault();
    setMessage('Updating player...');
    try {
      // THIS IS THE CRITICAL LINE. ENSURE IT USES BACKTICKS (`)
      // and NOT single quotes (') or double quotes (").
      // Also, ensure there are NO HTML tags like <span> or &lt;span&gt; here.
      const response = await fetch(`${API_BASE_URL}/players/${updateUsername}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chips: parseFloat(updateChips) }), // Ensure chips is a number
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      setMessage(`Player '${data.player.username}' updated!`);
      setUpdateUsername('');
      setUpdateChips('');
      fetchPlayers(); // Refresh the player list
    } catch (error) {
      console.error("Error updating player:", error);
      setMessage(`Error updating player: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <h1>Blackjack Game Dashboard</h1>

      {message && <p style={{ color: message.includes('Error') ? 'red' : 'green' }}>{message}</p>}

      {/* --- Display Players --- */}
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

      {/* --- Add New Player Form --- */}
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

      {/* --- Update Player Chips Form --- */}
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

      {/* Optional: Add a button to refresh players manually */}
      <button onClick={fetchPlayers}>Refresh Player List</button>
    </div>
  );
}

export default App;
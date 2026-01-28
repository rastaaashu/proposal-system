const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database('./proposals.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    createTable();
  }
});

// Create responses table
function createTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id TEXT NOT NULL,
      decision TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      telegram TEXT,
      company TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err.message);
    } else {
      console.log('Responses table ready.');
    }
  });
}

// API endpoint to submit proposal response
app.post('/api/proposal/response', (req, res) => {
  const { proposalId, decision, name, email, telegram, company, notes } = req.body;

  if (!proposalId || !decision || !name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    INSERT INTO responses (proposal_id, decision, name, email, telegram, company, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [proposalId, decision, name, email, telegram || '', company || '', notes || ''], function(err) {
    if (err) {
      console.error('Error inserting response:', err.message);
      return res.status(500).json({ error: 'Failed to save response' });
    }

    console.log(`New response saved: ${decision} by ${name} for ${proposalId}`);
    res.json({ 
      success: true, 
      message: 'Response saved successfully',
      id: this.lastID 
    });
  });
});

// API endpoint to get all responses (for you to view)
app.get('/api/responses', (req, res) => {
  db.all('SELECT * FROM responses ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching responses:', err.message);
      return res.status(500).json({ error: 'Failed to fetch responses' });
    }
    res.json(rows);
  });
});

// API endpoint to get responses for a specific proposal
app.get('/api/responses/:proposalId', (req, res) => {
  const proposalId = req.params.proposalId;
  db.all('SELECT * FROM responses WHERE proposal_id = ? ORDER BY created_at DESC', [proposalId], (err, rows) => {
    if (err) {
      console.error('Error fetching responses:', err.message);
      return res.status(500).json({ error: 'Failed to fetch responses' });
    }
    res.json(rows);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Proposal system running!`);
  console.log(`📄 View proposals at: http://localhost:${PORT}`);
  console.log(`📊 View all responses at: http://localhost:${PORT}/api/responses\n`);
});

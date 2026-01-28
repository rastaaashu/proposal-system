const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory store (temporary) just so you can see something working
const responses = [];

// API endpoint to submit proposal response
app.post('/api/proposal/response', (req, res) => {
  const { proposalId, decision, name, email, telegram, company, notes } = req.body;

  if (!proposalId || !decision || !name || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const entry = {
    id: responses.length + 1,
    proposal_id: proposalId,
    decision,
    name,
    email,
    telegram: telegram || '',
    company: company || '',
    notes: notes || '',
    created_at: new Date().toISOString()
  };

  responses.push(entry);

  console.log(`New response: ${decision} by ${name} for ${proposalId}`);
  console.log(entry);

  res.json({
    success: true,
    message: 'Response received',
    id: entry.id
  });
});

// API endpoint to get all responses (for you to view)
app.get('/api/responses', (req, res) => {
  res.json(responses);
});

// API endpoint to get responses for a specific proposal
app.get('/api/responses/:proposalId', (req, res) => {
  const proposalId = req.params.proposalId;
  const filtered = responses.filter(r => r.proposal_id === proposalId);
  res.json(filtered);
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Proposal system running on port ${PORT}`);
  console.log(`📄 View proposals at: http://localhost:${PORT}/proposal.html\n`);
});

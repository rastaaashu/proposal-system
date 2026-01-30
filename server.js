const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// --------------------
// EMAIL CONFIG
// --------------------
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --------------------
// In-memory store (temporary)
// --------------------
const responses = [];

// --------------------
// POST: proposal response
// --------------------
app.post('/api/proposal/response', async (req, res) => {
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
    created_at: new Date().toISOString(),
    ip:
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'unknown'
  };

  // Save in memory (for browser view)
  responses.push(entry);

  console.log(`New response: ${decision} by ${name} for ${proposalId}`);
  console.log(entry);

  // --------------------
  // SEND EMAIL
  // --------------------
  try {
    await transporter.sendMail({
      from: `"Proposal System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `📩 ${decision.toUpperCase()} — ${proposalId}`,
      text: JSON.stringify(entry, null, 2),
      html: `
        <h2>New Proposal Response</h2>
        <p><strong>Proposal:</strong> ${proposalId}</p>
        <p><strong>Decision:</strong> ${decision}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr/>
        <pre>${JSON.stringify(entry, null, 2)}</pre>
      `
    });
  } catch (err) {
    console.error('❌ Email failed:', err);
  }

  res.json({
    success: true,
    message: 'Response received',
    id: entry.id
  });
});

// --------------------
// GET: all responses
// --------------------
app.get('/api/responses', (req, res) => {
  res.json(responses);
});

// --------------------
// GET: responses by proposal
// --------------------
app.get('/api/responses/:proposalId', (req, res) => {
  const proposalId = req.params.proposalId;
  const filtered = responses.filter(r => r.proposal_id === proposalId);
  res.json(filtered);
});

// --------------------
// START SERVER
// --------------------
app.listen(PORT, () => {
  console.log(`\n🚀 Proposal system running on port ${PORT}`);
  console.log(`📄 View proposals at: http://localhost:${PORT}/proposal.html`);
  console.log(`📬 Email notifications ENABLED\n`);
});

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --------------------
// Middleware
// --------------------
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// --------------------
// RESEND EMAIL CONFIG
// --------------------
const resend = new Resend(process.env.RESEND_API_KEY);

// --------------------
// In-memory store (optional – only for viewing)
// --------------------
const responses = [];

// --------------------
// POST: proposal response
// --------------------
app.post("/api/proposal/response", async (req, res) => {
  const { proposalId, decision, name, email, telegram, company, notes } = req.body;

  if (!proposalId || !decision || !name || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const entry = {
    id: responses.length + 1,
    proposal_id: proposalId,
    decision,
    name,
    email,
    telegram: telegram || "",
    company: company || "",
    notes: notes || "",
    created_at: new Date().toISOString(),
    ip:
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "unknown"
  };

  // Store temporarily (not relied on)
  responses.push(entry);

  console.log(`📩 ${decision.toUpperCase()} — ${proposalId}`);
  console.log(entry);

  // --------------------
  // SEND EMAIL (PERMANENT RECORD)
  // --------------------
  try {
    await resend.emails.send({
      from: "Proposal System <onboarding@resend.dev>",
      to: [process.env.EMAIL_TO],
      subject: `📩 ${decision.toUpperCase()} — ${proposalId}`,
      html: `
        <h2>New Proposal Response</h2>
        <p><strong>Proposal ID:</strong> ${proposalId}</p>
        <p><strong>Decision:</strong> ${decision}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || "N/A"}</p>
        <p><strong>Telegram:</strong> ${telegram || "N/A"}</p>
        <p><strong>Notes:</strong> ${notes || "None"}</p>
        <hr />
        <pre style="background:#111;color:#0f0;padding:12px;border-radius:6px">
${JSON.stringify(entry, null, 2)}
        </pre>
      `
    });

    console.log("✅ Email sent successfully");
  } catch (err) {
    console.error("❌ Email failed:", err);
  }

  res.json({
    success: true,
    message: "Response received and emailed",
    id: entry.id
  });
});

// --------------------
// GET: all responses (temporary view only)
// --------------------
app.get("/api/responses", (req, res) => {
  res.json(responses);
});

// --------------------
// GET: responses by proposal
// --------------------
app.get("/api/responses/:proposalId", (req, res) => {
  const filtered = responses.filter(
    r => r.proposal_id === req.params.proposalId
  );
  res.json(filtered);
});

// --------------------
// START SERVER
// --------------------
app.listen(PORT, () => {
  console.log(`🚀 Proposal system running on port ${PORT}`);
});

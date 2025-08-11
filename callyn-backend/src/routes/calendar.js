// routes/calendar.js
const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.resolve(__dirname, "../db/callyn.db");
const db = new sqlite3.Database(dbPath);

// Ensure table exists
db.run(`
  CREATE TABLE IF NOT EXISTS user_calendar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    token_type TEXT,
    expiry_date TEXT,
    UNIQUE(email, provider)
  )
`);

/**
 * Save Google Calendar OAuth tokens
 */
router.post("/save-calendar-tokens", (req, res) => {
  const { provider, access_token, expires_in, token_type, email } = req.body;

  if (provider !== "google") {
    return res.status(400).json({ error: "Unsupported provider" });
  }
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const expiryDate = new Date(Date.now() + expires_in * 1000).toISOString();

  db.run(
    `
    INSERT INTO user_calendar (email, provider, access_token, token_type, expiry_date)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(email, provider) DO UPDATE SET
      access_token = excluded.access_token,
      token_type = excluded.token_type,
      expiry_date = excluded.expiry_date
  `,
    [email, provider, access_token, token_type, expiryDate],
    function (err) {
      if (err) {
        console.error("Error saving Google Calendar tokens:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true });
    }
  );
});

/**
 * Fetch upcoming Google Calendar events
 */
router.get("/events", (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email required" });

  db.get(
    "SELECT access_token FROM user_calendar WHERE email = ? AND provider = 'google'",
    [email],
    async (err, row) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (!row) {
        return res.status(401).json({ error: "Google Calendar not connected" });
      }

      try {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: row.access_token });

        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        const events = await calendar.events.list({
          calendarId: "primary",
          timeMin: new Date().toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: "startTime",
        });

        res.json({ events: events.data.items });
      } catch (apiErr) {
        console.error("Google Calendar API error:", apiErr);
        res.status(500).json({ error: "Failed to fetch events" });
      }
    }
  );
});

module.exports = router;

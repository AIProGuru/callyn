const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/callyn.db');
const db = new sqlite3.Database(dbPath);

// ===================== EMAIL ENDPOINT ===================== //
router.post('/send-email', async (req, res) => {
  const { to, subject, message } = req.body;
  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Pro Landscape" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: message,
    });

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ===================== SMS ENDPOINT ===================== //
router.post('/send-sms', async (req, res) => {
  res.status(501).json({ message: 'SMS sending not implemented yet' });
});

// ===================== CHECK CALENDAR AVAILABILITY ===================== //
router.post('/check-calendar-availability', (req, res) => {
  const { email, availableSlots } = req.body;

  if (!email || !availableSlots || !Array.isArray(availableSlots) || availableSlots.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid required fields' });
  }

  // Validate and filter out invalid slots
  const validSlots = availableSlots.filter(s => {
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start < end;
  });

  if (validSlots.length === 0) {
    return res.status(400).json({ error: 'No valid available slots provided' });
  }

  db.get(
    `SELECT access_token, expiry_date FROM user_calendar WHERE email = ? AND provider = 'google'`,
    [email],
    async (err, row) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'No connected Google Calendar found for user' });
      }

      const { access_token, expiry_date } = row;
      const now = new Date();
      if (new Date(expiry_date) < now) {
        return res.status(401).json({ error: 'Google Calendar token expired. Please reconnect.' });
      }

      try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token });
        const calendar = google.calendar({ version: 'v3', auth });

        // Use validated slots
        const overallStart = new Date(Math.min(...validSlots.map(s => new Date(s.startTime).getTime())));
        const overallEnd = new Date(Math.max(...validSlots.map(s => new Date(s.endTime).getTime())));

        // Get busy times from Google Calendar for overall range
        const fbRes = await calendar.freebusy.query({
          requestBody: {
            timeMin: overallStart.toISOString(),
            timeMax: overallEnd.toISOString(),
            items: [{ id: 'primary' }],
          },
        });

        const busySlots = fbRes.data.calendars.primary.busy;

        function isSlotFree(slotStart, slotEnd) {
          return !busySlots.some(busy => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            return slotStart < busyEnd && slotEnd > busyStart;
          });
        }

        const slotDurationMs = 30 * 60 * 1000; // 30 minutes

        let earliestFreeSlot = null;

        outerLoop:
        for (const range of validSlots) {
          const rangeStart = new Date(range.startTime);
          const rangeEnd = new Date(range.endTime);

          for (let slotStartMs = rangeStart.getTime(); slotStartMs + slotDurationMs <= rangeEnd.getTime(); slotStartMs += slotDurationMs) {
            const slotStart = new Date(slotStartMs);
            const slotEnd = new Date(slotStartMs + slotDurationMs);

            if (isSlotFree(slotStart, slotEnd)) {
              earliestFreeSlot = { start: slotStart.toISOString(), end: slotEnd.toISOString() };
              break outerLoop;
            }
          }
        }

        if (!earliestFreeSlot) {
          return res.status(200).json({ available: false, message: 'No 30-minute slots available in provided ranges', busySlots });
        }

        res.status(200).json({
          available: true,
          slot: earliestFreeSlot,
          busySlots
        });

      } catch (err) {
        console.error('Availability check error:', err);
        res.status(500).json({ error: 'Failed to check calendar availability' });
      }
    }
  );
});


// ===================== BOOK MEETING ===================== //
router.post('/book-meeting', (req, res) => {
  const { email, startTime, endTime } = req.body;

  if (!email || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.get(
    `SELECT access_token, expiry_date FROM calendar_tokens WHERE email = ? AND provider = 'google'`,
    [email],
    async (err, row) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'No connected Google Calendar found for user' });
      }

      const { access_token, expiry_date } = row;
      const now = new Date();
      if (new Date(expiry_date) < now) {
        return res.status(401).json({ error: 'Google Calendar token expired. Please reconnect.' });
      }

      try {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token });
        const calendar = google.calendar({ version: 'v3', auth });

        const event = {
          summary: 'Meeting with Pro Landscape',
          start: { dateTime: new Date(startTime).toISOString() },
          end: { dateTime: new Date(endTime).toISOString() },
        };

        const insertRes = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: event,
        });

        res.status(200).json({ success: true, eventId: insertRes.data.id });
      } catch (err) {
        console.error('Meeting booking error:', err);
        res.status(500).json({ error: 'Failed to book meeting' });
      }
    }
  );
});

module.exports = router;

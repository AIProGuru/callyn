const express = require('express')
const router = express.Router()
const fetch = require('node-fetch')

// Proxy ElevenLabs voices to avoid browser CORS and keep secrets server-side
router.get('/voices', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' })
    }

    const r = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    if (!r.ok) {
      const text = await r.text().catch(() => '')
      return res.status(r.status).json({ error: 'Upstream error', detail: text })
    }

    const json = await r.json()
    res.status(200).json(json)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router



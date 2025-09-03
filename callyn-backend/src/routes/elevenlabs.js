const express = require('express')
const router = express.Router()
const axios = require('axios')

// Proxy ElevenLabs voices to avoid browser CORS and keep secrets server-side
router.get('/voices', async (req, res) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' })
    }

    const r = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    res.status(200).json(r.data)
  } catch (err) {
    const status = err?.response?.status || 500
    const detail = err?.response?.data || err?.message || 'Server error'
    res.status(status).json({ error: 'Server error', detail })
  }
})

module.exports = router



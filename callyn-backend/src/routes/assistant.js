const express = require('express')
const router = express.Router()

const { createFirstAssistant, createAssistant, getAssistant, updateAssistant, updateAssistantById, generatePrompt } = require('../controllers/assistant')
const authMiddleware = require('../middlewares/auth')

router.post('/first-agent', authMiddleware, createFirstAssistant)
router.post('/', authMiddleware, createAssistant)
router.get('/', authMiddleware, getAssistant)
router.put('/', authMiddleware, updateAssistant)
router.put('/:id', authMiddleware, updateAssistantById)
router.post('/generate-prompt', authMiddleware, generatePrompt)

module.exports = router
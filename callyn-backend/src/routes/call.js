const express = require('express')
const router = express.Router()

const { getCall, createCall, createOutboundCall } = require('../controllers/call')
const authMiddleware = require('../middlewares/auth')

router.get('/', authMiddleware, getCall)
router.post('/:contact_id', authMiddleware, createCall)
router.post('/', authMiddleware, createOutboundCall)

module.exports = router
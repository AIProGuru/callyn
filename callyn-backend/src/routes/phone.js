const express = require('express')
const router = express.Router()

const { getPhones, getAvailablePhones, getExistingPhones, addPhone, purchasePhone, importExistingPhone, deletePhone } = require('../controllers/phone')
const authMiddleware = require('../middlewares/auth')

router.get('/', authMiddleware, getPhones)
router.get('/available', authMiddleware, getAvailablePhones)
router.get('/existing', authMiddleware, getExistingPhones)
router.post('/', authMiddleware, addPhone)
router.post('/purchase', authMiddleware, purchasePhone)
router.post('/import', authMiddleware, importExistingPhone)
router.delete('/:phone_id', authMiddleware, deletePhone)

module.exports = router
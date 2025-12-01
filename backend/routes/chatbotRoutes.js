// routes/chatbotRoutes.js

const express = require('express');
const router = express.Router();

const {
  sendMessage,
  getCommonQuestions,
  getStats
} = require('../controllers/chatbotController');

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/common-questions', getCommonQuestions);
router.get('/stats', getStats);

// Protected route for chat (Patient only)
router.post('/message', protect, authorize('patient'), sendMessage);

module.exports = router;

const express = require('express');
const { loginUser, validateToken } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', loginUser);
router.post('/validateToken', validateToken);

module.exports = router;

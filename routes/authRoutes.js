const express = require('express');
const { loginUser, validateToken, loginAdmin, admin, protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', loginUser);
router.post('/admin/login', loginAdmin);
router.post('/validateToken', validateToken);

module.exports = router;
 
const express = require('express');
const { createAdmin, getAdmins, getAdminById, updateAdmin, deleteAdmin } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, admin, getAdmins);

router.post('/', protect, admin, createAdmin);

router.get('/:id', protect, admin, getAdminById);

router.put('/:id', protect, admin, updateAdmin);

router.delete('/:id', protect, admin, deleteAdmin);

module.exports = router;

const express = require('express');
const { createAdmin, getAdmins, getAdminById, updateAdmin, deleteAdmin } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAdmins);
router.post('/', createAdmin);

router.get('/:id', getAdminById);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

module.exports = router;

// router.get('/', protect, admin, getAdmins);
// router.post('/', protect, admin, createAdmin);

// router.get('/:id', protect, admin, getAdminById);
// router.put('/:id', protect, admin, updateAdmin);
// router.delete('/:id', protect, admin, deleteAdmin); 
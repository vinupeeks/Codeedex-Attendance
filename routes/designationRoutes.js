// routes/designationRoutes.js
const express = require('express');
const { createDesignation, getDesignations, getDesignationById, updateDesignation, deleteDesignation, } = require('../controllers/designationController');
const { protect, admin, employee } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, admin, createDesignation);

router.get('/', protect, admin, getDesignations);

router.get('/:id', protect, admin, getDesignationById);

router.put('/:id', protect, admin, updateDesignation);

router.delete('/:id', protect, admin, deleteDesignation);

module.exports = router;

// routes/designationRoutes.js
const express = require('express');
const { createDesignation, getDesignations, getDesignationById, updateDesignation, deleteDesignation, } = require('../controllers/designationController');

const router = express.Router();

router.post('/', createDesignation);
router.get('/', getDesignations);
router.get('/:id', getDesignationById);
router.put('/:id', updateDesignation);
router.delete('/:id', deleteDesignation);

module.exports = router;

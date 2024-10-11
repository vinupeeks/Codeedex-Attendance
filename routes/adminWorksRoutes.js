const express = require('express');
const router = express.Router();
const adminWorksController = require('../controllers/adminWorksController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Admin routes (CRUD for works)
router.get('/', protect, adminWorksController.getAllWorks);
router.get('/:workId', protect, adminWorksController.getWorkById);
router.post('/create', protect, adminWorksController.createWork);
router.put('/edit/:workId', protect, adminWorksController.editWork);
router.delete('/delete/:workId', protect, adminWorksController.deleteWork);

module.exports = router;

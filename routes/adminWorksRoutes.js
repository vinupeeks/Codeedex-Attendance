const express = require('express');
const router = express.Router();
const adminWorksController = require('../controllers/adminWorksController.js');
const { protect, admin } = require('../middleware/authMiddleware.js');

// Admin routes (CRUD for works)
router.get('/', protect, admin, adminWorksController.getAllWorks);


router.get('/:workId', protect, admin, adminWorksController.getWorkById);

router.post('/create', protect, admin, adminWorksController.createWork);

router.put('/edit/:workId', protect, admin, adminWorksController.editWork);

router.delete('/delete/:workId', protect, admin, adminWorksController.deleteWork);

module.exports = router;

const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const { getOneMonthAbsenceRecords, getOneMonthAbsenceByEmployeeCode } = require('../controllers/adminAbsenceController');

const router = express.Router();

router.get('/records/:month/:year', protect, admin, getOneMonthAbsenceRecords);

router.get('/records/:employeeCode/:month/:year', protect, admin, getOneMonthAbsenceByEmployeeCode);

module.exports = router;
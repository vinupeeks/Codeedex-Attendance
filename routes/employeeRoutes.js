const express = require('express');
const { createEmployee, getEmployees, getEmployeeById, updateEmployee, deleteEmployee } = require('../controllers/employeeController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getEmployees);
router.post('/', createEmployee);
router.get('/:id', getEmployeeById);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;

// router.get('/', protect, admin, getEmployees);
// router.post('/', protect, admin, createEmployee);
// router.get('/:id', protect, admin, getEmployeeById);
// router.put('/:id', protect, admin, updateEmployee);
// router.delete('/:id', protect, admin, deleteEmployee); 
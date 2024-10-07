const express = require('express');
const { createEmployee, getEmployees, getEmployeeById, updateEmployee, deleteEmployee } = require('../controllers/employeeController');

const router = express.Router();

router.route('/')
    .get(getEmployees)          // Get all employees
    .post(createEmployee);      // Create new employee

router.route('/:id')
    .get(getEmployeeById)      // Get employee by ID
    .put(updateEmployee)       // Update employee by ID
    .delete(deleteEmployee);   // Delete employee by ID

module.exports = router;

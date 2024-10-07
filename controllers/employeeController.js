const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const Employee = require('../models/Employee');
const Designation = require('../models/Designation');

// Create a new employee
const createEmployee = async (req, res) => {
    const { name, password, employeeCode, designation, email, username, teamLead, workMode } = req.body;

    try {
        // Hash the password
        const existingUser = await Employee.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const existingEmpCode = await Employee.findOne({ employeeCode });
        if (existingEmpCode) {
            return res.status(400).json({ message: 'Employee code already used..!' });
        }
        const existingUserName = await Employee.findOne({ username });
        if (existingUserName) {
            return res.status(400).json({ message: 'User Name already used..!' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newEmployee = new Employee({
            name,
            password: hashedPassword,
            employeeCode,
            designation,
            email,
            username,
            teamLead,
            workMode,
        });

        await newEmployee.save();
        const employeeResponse = newEmployee.toObject();
        delete employeeResponse.password;

        res.status(201).json(employeeResponse);
    } catch (error) {
        res.status(400).json({ message: 'Error creating employee: ' + error.message });
    }
};

// Get all employees
const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find()
            .select('name designation email username workMode')
            .populate('designation', 'title');

        if (!employees || employees.length === 0) {
            return res.status(404).json({ message: 'No employees found' });
        }

        res.json(employees);
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
    const { id } = req.params;
    try {
        const employee = await Employee.findById(id)
            .select('name designation email username')
            .populate('designation', 'title');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};


// Update an employee
const updateEmployee = async (req, res) => {
    const { id } = req.params;
    const { name, email, username, password, designation, teamLead, workMode, role } = req.body;
    // console.log(name)

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
    }
    if (email) {
        const existingUserEmail = await Employee.findOne({ email, _id: { $ne: id } });
        if (existingUserEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }
    }

    const existingUserName = await Employee.findOne({ username });
    if (existingUserName) {
        return res.status(400).json({ message: 'User Name already used..!' });
    }

    if (designation) {
        const existingUserDesignation = await Designation.findOne({ _id: designation });
        if (!existingUserDesignation) {
            console.log(existingUserDesignation)
            return res.status(400).json({ message: 'Designation Not Found..!' });
        }
    }

    try {
        const updateData = {};

        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (username) updateData.username = username;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        if (designation) {
            const designationExists = await Designation.findById(designation);
            if (!designationExists) {
                return res.status(404).json({ message: 'Designation not found' });
            }
            updateData.designation = designation;
        }

        if (teamLead) updateData.teamLead = teamLead;
        if (workMode) updateData.workMode = workMode;
        if (role) updateData.role = role;

        const employee = await Employee.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate('designation');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json({
            message: 'Employee updated successfully',
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                username: employee.username,
                designation: employee.designation
                    ? {
                        id: employee.designation._id,
                        title: employee.designation.title,
                        description: employee.designation.description,
                    }
                    : null,
                role: employee.role,
                teamLead: employee.teamLead,
                workMode: employee.workMode,
            }
        });
    } catch (error) {
        res.status(400).json({ message: 'Error updating employee: ' + error.message });
    }
};

// Delete an employee by ID
const deleteEmployee = async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid employee ID' });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    try {
        const employeeDetails = await Employee.findByIdAndDelete(id).populate('designation');
        res.json({
            message: 'Employee deleted successfully',
            deletedEmployee: {
                id: employeeDetails._id,
                name: employeeDetails.name,
                email: employeeDetails.email,
                username: employeeDetails.username,
                designation: {
                    id: employeeDetails.designation._id,
                    title: employeeDetails.designation.title,
                    description: employeeDetails.designation.description,
                }
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
};

const Admin = require("../models/Admin");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const Designation = require("../models/Designation");
const Work = require("../models/work");


// Create a new work
exports.createWork = async (req, res) => {
    try {
        const { workName, designation, assignedTo, deadline, admin } = req.body;
        const adminId = req.user._id; // User details attached by middleware

        if (!ObjectId.isValid(admin)) {
            return res.status(400).json({ message: 'Invalid employee ID' });
        }

        const AdminFound = await Admin.findById(admin);
        if (!AdminFound) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!Array.isArray(assignedTo) || assignedTo.length === 0) {
            return res.status(400).json({ message: 'At least one user must be assigned to the work' });
        }

        const designationFound = await Designation.findById(designation);
        if (!designationFound) {
            return res.status(404).json({ message: 'Designation not found' });
        }

        const assignedEmployees = assignedTo.map(empId => ({
            employee: empId,
            status: 'pending'
        }));

        const newWork = new Work({
            workName,
            designation: designationFound._id,
            assignedTo: assignedEmployees,
            deadline,
            admin: AdminFound._id,
        })
        await newWork.save();
        res.status(201).json({ message: 'Work created successfully', work: newWork });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getAllWorks = async (req, res) => {
    try {
        const works = await Work.find()
            .select('-createdAt -updatedAt')
            .populate('designation', 'title')
            .populate({
                path: 'assignedTo.employee',
                select: 'username email employeeCode designation',
                populate: { path: 'designation', select: 'title' }
            });

        if (!works) {
            return res.status(404).json({ message: "No works found" });
        }

        res.status(200).json({
            success: true,
            data: works
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};


exports.getWorkById = async (req, res) => {
    const { workId } = req.params;

    try {

        if (!ObjectId.isValid(workId)) {
            return res.status(400).json({ message: 'Invalid Work ID' });
        }

        const works = await Work.findById(workId)
            .select('-createdAt -updatedAt')
            .populate('designation', 'title')
            .populate({
                path: 'assignedTo.employee',
                select: 'username email employeeCode designation',
                populate: { path: 'designation', select: 'title' }
            });
        if (!works) {
            return res.status(404).json({ message: "No works found" });
        }

        res.status(200).json({
            success: true,
            data: works
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

// Edit work details
exports.editWork = async (req, res) => {
    try {
        const { workName, designation, assignedTo, deadline, status } = req.body;
        const { workId } = req.params;

        if (!ObjectId.isValid(workId)) {
            return res.status(400).json({ message: 'Invalid work ID' });
        }

        let work = await Work.findById(workId);
        if (!work) {
            return res.status(404).json({ message: 'Work not found' });
        }

        work.workName = workName || work.workName;
        work.designation = designation || work.designation;
        work.deadline = deadline || work.deadline;

        // Validate that admin is not changing employee statuses
        if (assignedTo && Array.isArray(assignedTo)) {
            const originalAssignedTo = work.assignedTo.map(emp => emp.employee.toString());

            assignedTo.forEach(assigned => {
                if (!originalAssignedTo.includes(assigned.employee)) {
                    work.assignedTo.push({
                        employee: assigned.employee,
                        status: 'pending'
                    });
                }
            });
        }
        if (status) {
            if (['pending', 'in-progress', 'completed'].includes(status)) {
                work.status = status;
            } else {
                return res.status(400).json({ message: 'Invalid work status' });
            }
        }

        await work.save();

        const populatedWork = await Work.findById(workId)
            .select('-createdAt -updatedAt')
            .populate('designation', 'title')
            .populate({
                path: 'assignedTo.employee',
                select: 'username email employeeCode',
                populate: { path: 'designation', select: 'title' }
            });
        res.status(200).json({ message: 'Work updated successfully', work: populatedWork });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};


// Delete work
exports.deleteWork = async (req, res) => {
    try {
        const { workId } = req.params;

        const work = await Work.findById(workId)
            .select('-createdAt -updatedAt')
            .populate('designation', 'title')
            .populate({
                path: 'assignedTo',
                select: 'username employeeCode'
            });
        if (!work) {
            return res.status(404).json({ message: 'Work not found' });
        }

        await Work.findByIdAndDelete(workId);
        res.status(200).json({ message: 'Work deleted successfully', work });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

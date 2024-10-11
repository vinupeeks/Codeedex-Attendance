const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const Admin = require('../models/Admin');
const Sequence = require('../models/AdminSequence');
const AdminSequence = require('../models/AdminSequence');

// Create a new admin
const createAdmin = async (req, res) => {
    const { fullName, password, email, username, address } = req.body;

    try {
        const lowerEmail = email.toLowerCase();
        const existingEmail = await Admin.findOne({ email: lowerEmail });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        // const existingAdminCode = await Admin.findOne({ adminCode });
        // if (existingAdminCode) {
        //     return res.status(400).json({ message: 'Admin code already exists' });
        // }
        const existingUsername = await Admin.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const noAdminFound = await Admin.findOne({});
        if (!noAdminFound) {
            const noSequenceFound = await AdminSequence.findOne({ sequenceName: 'AdminCode' });
            if (!noSequenceFound) {
                await Sequence.create({ sequenceName: 'AdminCode', sequenceValue: 100 });
            }
            await Sequence.findOneAndUpdate(
                { sequenceName: 'AdminCode' },
                { sequenceValue: 99 },
                { new: true }
            );
        }

        // Increment sequence for admin code
        const sequence = await Sequence.findOneAndUpdate(
            { sequenceName: 'AdminCode' },
            { $inc: { sequenceValue: 1 } },
            { new: true, upsert: true }
        );

        const adminCodeGenerated = `CTAD${sequence.sequenceValue}`;
        // const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new Admin({
            fullName,
            password: password,
            adminCode: adminCodeGenerated,
            email: lowerEmail,
            username,
            address,
        });

        await newAdmin.save();

        const adminResponse = newAdmin.toObject();
        delete adminResponse.password;

        res.status(201).json(adminResponse);
    } catch (error) {
        res.status(400).json({ message: 'Error creating admin: ' + error.message });
    }
};

// Get all admins
const getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find()
            .select('fullName username email adminCode address');

        if (!admins || admins.length === 0) {
            return res.status(404).json({ message: 'No admins found' });
        }

        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Get admin by ID
const getAdminById = async (req, res) => {
    const { id } = req.params;
    try {
        const admin = await Admin.findById(id)
            .select('fullName username email adminCode address');

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Update an admin
const updateAdmin = async (req, res) => {
    const { id } = req.params;
    const { fullName, email, username, password, address } = req.body;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid admin ID' });
    }

    try {
        const updateData = {};

        if (fullName) updateData.fullName = fullName;
        if (email) {
            const lowerEmail = email.toLowerCase();
            const existingEmail = await Admin.findOne({ email: lowerEmail, _id: { $ne: id } });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            updateData.email = lowerEmail;
        }
        const existingUser = await Admin.findById(id);
        if (!existingUser) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        if (username !== existingUser.username) {
            const existingUserName = await Admin.findOne({ username });
            if (existingUserName) {
                return res.status(400).json({ message: 'Username is already used by another Admin' });
            }
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }
        if (address) updateData.address = address;

        const admin = await Admin.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({
            message: 'Admin updated successfully',
            admin: {
                id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                username: admin.username,
                adminCode: admin.adminCode,
                address: admin.address,
            }
        });
    } catch (error) {
        res.status(400).json({ message: 'Error updating admin: ' + error.message });
    }
};

// Delete an admin by ID
const deleteAdmin = async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid admin ID' });
    }

    const admin = await Admin.findById(id);
    if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
    }

    try {
        const adminDetails = await Admin.findByIdAndDelete(id);

        res.json({
            message: 'Admin deleted successfully',
            deletedAdmin: {
                id: adminDetails._id,
                fullName: adminDetails.fullName,
                email: adminDetails.email,
                username: adminDetails.username,
                adminCode: adminDetails.adminCode,
                address: adminDetails.address,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = {
    createAdmin,
    getAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
};

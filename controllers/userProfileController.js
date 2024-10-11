const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
const ObjectId = require('mongoose').Types.ObjectId;

exports.editProfile = async (req, res) => {
    try {
        const { email, name, actualPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        let user = await Employee.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (newPassword) {
            if (!actualPassword) {
                return res.status(400).json({ message: 'Please provide the current password to update the password' });
            }

            const isMatch = await bcrypt.compare(actualPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect current password' });
            }

            if (newPassword.length < 4) {
                return res.status(400).json({ message: 'New password must be at least 4 characters long' });
            }
            user.password = newPassword;
        }

        if (email) {
            const existingUserEmail = await Employee.findOne({ email, _id: { $ne: userId } }); // Use userId here
            if (existingUserEmail) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            user.email = email;
        }
        if (name) {
            user.name = name;
        }

        await user.save();
        res.status(200).json({ message: 'Profile updated successfully', user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.userDetails = async (req, res) => {
    const userId = req.user._id;
    try {
        const employee = await Employee.findById(userId)
            .select('name designation email username workMode employeeCode')
            .populate('designation', 'title');
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.json(employee);
    } catch (error) {
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};


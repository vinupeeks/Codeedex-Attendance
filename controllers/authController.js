
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const bcryptjs = require('bcryptjs');

// Register a user
exports.registerUser = async (req, res) => {
    const { username, email, password, isAdmin } = req.body;
    console.log(`User Data:`, isAdmin);

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ username, email, password, isAdmin });
        await user.save();

        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login a user
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Employee.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid e-mail id' });
        }

        const isPasswordCorrect = await user.matchPassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role === 'admin' ? 'admin' : 'employee', // Set role dynamically
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.validateToken = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ isValid: false });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ isValid: true });
    } catch (error) {
        res.status(401).json({ isValid: false });
    }
};
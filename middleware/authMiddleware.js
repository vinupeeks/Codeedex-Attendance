const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
    // console.log(req.body);
    const token = req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // console.log('Decoded ID:', decoded);
            const id = decoded.user ? decoded.user.id : decoded.id;
            // console.log(id);
            let user = await Admin.findById(id).select('-password');
            // console.log('Found User:', user);
            if (!user) {
                user = await Employee.findById(id).select('-password');
            }

            if (!user) {
                return res.status(404).json({ message: 'User not found / Unauthorized Access' });
            }
            req.user = user;
            // console.log(`after auth: `, user);
            next();
        } catch (error) {
            // console.log('protect error');
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Session expired, please log in again' });
            } else {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Login a user
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Admin.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid Credentials, Email not found' });
        }

        const isPasswordCorrect = await user.matchPassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Invalid Credentials, Password Not Matched' });
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

        // const userDetails = {
        //     name: user.name,
        //     email: user.email,
        //     username: user.username,

        res.status(200).json({
            token,
            // userDetails
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login a user
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Employee.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid Credentials, Email not found' });
        }

        const isPasswordCorrect = await user.matchPassword(password);
        if (!isPasswordCorrect) {
            return res.status(401).json({ message: 'Invalid Credentials, Password Not Matched' });
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

        // const userDetails = {
        //     name: user.name,
        //     email: user.email,
        //     username: user.username,

        res.status(200).json({
            token, id: user._id
            // userDetails
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Validate token
const validateToken = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ isValid: false });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ decoded });
    } catch (error) {
        res.status(401).json({ isValid: false });
    }
};

// Is it Admin
const admin = (req, res, next) => {
    // console.log(`User :`, req.user);
    if (req.user && req.user.role === 'admin') {
        // console.log('admin');
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

// Is It Employee
const employee = (req, res, next) => {
    if (req.user && req.user.role === 'employee') {
        // console.log('prtct cmpltd');
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as employee' });
    }
};

module.exports = {
    protect,
    loginAdmin,
    loginUser,
    validateToken,
    admin,
    employee,
};

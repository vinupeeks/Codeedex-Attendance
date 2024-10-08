const Admin = require("../models/Admin");
const { ObjectId } = mongoose.Types;

// Register for admin
const registerAdmin = async (req, res) => {
    const { username, email, password, isAdmin } = req.body;
    console.log(`User Data:`, isAdmin);

    try {
        const existingUser = await Admin.findOne({ email });
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

module.exports = {
    registerAdmin
}
const express = require('express');
const connectDB = require('./config/db.js');
const UserRoutes = require('./routes/employeeRoutes.js');
const DesignationRoutes = require('./routes/designationRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');
const adminWorksRoutes = require('./routes/adminWorksRoutes.js');
const UserProfile = require('./routes/userProfileRoutes.js');
const UserWorks = require('./routes/userWorksRoutes.js');
const AdminAttendance = require('./routes/adminAttendanceEditionRoutes.js');

const attendanceRoutes = require('./routes/attendanceRoutes.js');

const cors = require('cors');
require('dotenv').config();

const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Route
app.use('/auth', authRoutes);

// Admin Routes 
app.use('/users', UserRoutes);
app.use('/Designation', DesignationRoutes);
app.use('/admin', adminRoutes);
app.use('/admin-works', adminWorksRoutes);
app.use('/admin-attendance', AdminAttendance);

// User Routes
app.use('/User-works', UserWorks);
app.use('/User-profile', UserProfile);
app.use('/attendance', attendanceRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

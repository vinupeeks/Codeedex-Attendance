const express = require('express');
const connectDB = require('./config/db.js');
const UserRoutes = require('./routes/employeeRoutes.js');
const DesignationRoutes = require('./routes/designationRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const cors = require('cors');
require('dotenv').config();

const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', UserRoutes);
app.use('/api/Designation', DesignationRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const mongoose = require('mongoose');
const Designation = require('../models/Designation');
const { ObjectId } = mongoose.Types;

// Create a new designation
const createDesignation = async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' });
    }
    const existingDesignation = await Designation.findOne({ title });
    if (existingDesignation) {
        return res.status(409).json({ message: 'Designation title already exists.' });
    }
    try {
        const designation = new Designation({ title, description });
        await designation.save();
        res.status(201).json(designation);
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: error.message });
    }
};

// Get all designations
const getDesignations = async (req, res) => {
    try {
        const designations = await Designation.aggregate([
            {
                $project: {
                    _id: 1,  // Include the ID field
                    title: 1,
                    description: 1
                }
            }
        ]);
        res.json(designations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single designation by ID
const getDesignationById = async (req, res) => {
    try {
        const designationId = req.params.id;

        if (!ObjectId.isValid(designationId)) {
            return res.status(400).json({ message: 'Invalid designation ID' });
        }
        const designation = await Designation.aggregate([
            {
                $match: { _id: new ObjectId(designationId) }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                }
            }
        ]);
        if (!designation || designation.length === 0) {
            return res.status(404).json({ message: 'Designation not found' });
        }
        res.json(designation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a designation
const updateDesignation = async (req, res) => {
    const { title, description } = req.body;

    if (!title && !description) {
        return res.status(400).json({ message: 'At least one of title or description is required.' });
    }

    try {
        const designationId = req.params.id;

        const designationExists = await Designation.findById(designationId);
        if (!designationExists) {
            return res.status(404).json({ message: 'Designation not found' });
        }

        if (title) {
            const existingTitle = await Designation.findOne({ title });
            if (existingTitle && existingTitle._id.toString() !== designationId) {
                return res.status(409).json({ message: 'Designation title already exists.' });
            }
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;

        // Update the designation
        await Designation.findByIdAndUpdate(designationId, updateData);

        const updatedDesignation = await Designation.aggregate([
            {
                $match: { _id: designationId }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                }
            }
        ]);
        // console.log(`Updated Designation:`, updatedDesignation);
        res.json({ message: 'Designation updated successfully', designation: updatedDesignation[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Delete a designation
const deleteDesignation = async (req, res) => {
    const designationId = req.params.id;
    try {
        const designation = await Designation.findById(designationId);

        if (!designation) {
            return res.status(404).json({ message: 'Designation not found' });
        }
        await Designation.findByIdAndDelete(designationId);

        res.json({
            message: 'Designation deleted successfully',
            deletedDesignation: {
                title: designation.title,
                description: designation.description
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    createDesignation,
    getDesignations,
    getDesignationById,
    updateDesignation,
    deleteDesignation,
};
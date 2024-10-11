const Work = require("../models/work");


// Get works assigned to a user
exports.getAssignedWorks = async (req, res) => {
    try {
        const userId = req.user._id;

        const assignedWorks = await Work.find({ assignedTo: userId }).populate('designation assignedTo');
        res.status(200).json({ works: assignedWorks });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update work status
exports.updateWorkStatus = async (req, res) => {
    const { workId, employeeId, status } = req.body; // Assume these values come from the request body
    try {
        // Validate status
        if (!['pending', 'in-progress', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Find the work document
        const work = await Work.findById(workId);
        if (!work) {
            return res.status(404).json({ message: 'Work not found' });
        }

        // Find the employee in assignedTo array and update their status
        const assignedEmployee = work.assignedTo.find(assignment => assignment.employee.toString() === employeeId);
        if (!assignedEmployee) {
            return res.status(404).json({ message: 'Employee not assigned to this work' });
        }

        // Update employee status
        assignedEmployee.status = status;
        await work.save();

        // Check if all employees have completed the work
        const allCompleted = work.assignedTo.every(assignment => assignment.status === 'completed');
        if (allCompleted) {
            work.status = 'completed';  // Update the overall work status
        } else {
            work.status = 'in-progress'; // Optional: Update status to in-progress if not all are completed
        }

        await work.save(); // Save the updated work

        res.status(200).json({
            success: true,
            message: 'Employee work status updated',
            data: work
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

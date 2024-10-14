const Work = require("../models/work");


// Get works assigned to a user
exports.getAssignedWorks = async (req, res) => {
    try {
        const userId = req.user._id;
        // console.log(userId);

        const assignedWorks = await Work.find({ 'assignedTo.employee': userId }, {
            workName: 1,
            deadline: 1,
            // 'assignedTo.$': 1,
            'assignedTo.status': 1,
            designation: 1,
            admin: 1
        })
            .populate('designation', 'title')
            .populate('assignedTo.employee', 'name')
            .populate('admin', 'username')
            .exec();

        const formattedWorks = assignedWorks.map(work => ({
            workId: work._id,
            workName: work.workName,
            designation: work.designation.title,
            status: work.assignedTo[0].status,
            deadline: work.deadline,
            admin: work.admin.username,
        }));

        res.status(200).json({ works: formattedWorks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update work status
exports.updateWorkStatus = async (req, res) => {
    const { workId, status } = req.body;
    const employeeId = req.user._id;

    try {
        if (!['pending', 'in-progress', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const work = await Work.findById(workId);
        if (!work) {
            return res.status(404).json({ message: 'Work not found' });
        }

        const assignedEmployee = work.assignedTo.find(assignment => assignment.employee.toString() === employeeId.toString());
        if (!assignedEmployee) {
            return res.status(404).json({ message: 'Employee not assigned to this work' });
        }

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


exports.getWorkDetailsById = async (req, res) => {
    try {
        const { workId } = req.params;
        // console.log("Work ID from request:", workId);

        const workDetails = await Work.findById(workId)
            .populate('designation', 'title')
            .populate('assignedTo.employee', 'name')
            .populate('admin', 'username')
            .exec();

        if (!workDetails) {
            return res.status(404).json({ message: 'Work not found' });
        }

        const formattedWork = {
            workId: workDetails._id,
            workName: workDetails.workName,
            designation: workDetails.designation.title,
            status: workDetails.assignedTo[0].status,
            deadline: workDetails.deadline,
            admin: workDetails.admin.username,
        };

        res.status(200).json({ work: formattedWork });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
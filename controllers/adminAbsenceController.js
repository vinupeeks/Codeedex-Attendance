const Attendance = require('../models/attendance');
const Employee = require('../models/Employee');

const convertToIST = (date) => {
    return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
};

const getOneMonthAbsenceRecords = async (req, res) => {
    try {
        const { month, year } = req.params;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59); 

        const employees = await Employee.find({}).populate(`designation`,`title`);

        let results = [];
        let totalAbsenceCount = 0;

        for (const employee of employees) {
            const absenceRecords = await Attendance.find({
                userId: employee._id,
                date: { $gte: startDate, $lte: endDate },
                status: 'Absent'
            });

            if (absenceRecords.length > 0) {
                const formattedAbsenceRecords = absenceRecords.map(record => ({
                    date: convertToIST(record.date).toISOString().slice(0, 10),
                }));

                totalAbsenceCount += absenceRecords.length;

                results.push({
                    employee: {
                        name: employee.name,
                        email: employee.email,
                        employeeCode: employee.employeeCode,
                        designation: employee.designation
                    },
                    totalAbsences: absenceRecords.length,
                    absences: formattedAbsenceRecords
                });
            }
        }
        if (results.length === 0) {
            return res.status(200).json({ message: 'No absences found for the specified month.' });
        }

        res.status(200).json({
            totalAbsenceCount,
            employeeAbsenceDetails: results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getOneMonthAbsenceByEmployeeCode = async (req, res) => {
    try {
        const { employeeCode, month, year } = req.params;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const employee = await Employee.findOne({ employeeCode }).populate(`designation`,`title`);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const absenceRecords = await Attendance.find({
            userId: employee._id,
            date: { $gte: startDate, $lte: endDate },
            status: 'Absent'
        });

        if (absenceRecords.length === 0) {
            return res.status(200).json({ message: 'No absences found for this employee in the specified month.' });
        }

        const formattedAbsenceRecords = absenceRecords.map(record => ({
            date: convertToIST(record.date).toISOString().slice(0, 10)
        }));
 
        res.status(200).json({
            employee: {
                name: employee.name,
                email: employee.email,
                employeeCode: employee.employeeCode,
                designation: employee.designation
            },
            totalAbsences: absenceRecords.length,
            absences: formattedAbsenceRecords
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getOneMonthAbsenceRecords,
    getOneMonthAbsenceByEmployeeCode
};

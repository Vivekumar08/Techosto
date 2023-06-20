const express = require("express");
const connectToDatabase = require("../db/connection");
const auth = require("../Middleware/auth");
const { generateId, calculateDuration, calculateEndTime } = require("../utils/basicFunctions");
const { ObjectId } = require("mongodb");
const TimeEntryRouter = express.Router();

// Create Time Entry API
TimeEntryRouter.post('/', auth, async (req, res) => {
    try {
        const { projectId, description, date, startTime, endTime, hours, minute } = req.body;

        let finalEndTime;
        let finalhours;
        let finalminute;

        const db = await connectToDatabase();
        const TimeEntryCollection = db.collection('time-entries')

        // Regex patterns for validation
        const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
        const timePattern = /^\d{2}:\d{2}$/;

        // Validate fields
        if (!projectId || typeof projectId !== 'string') {
            res.status(400).json({ error: 'Invalid projectId. Please provide a valid projectId as a string.' });
            return;
        }

        if (!description || typeof description !== 'string') {
            res.status(400).json({ error: 'Invalid description. Please provide a valid description as a string.' });
            return;
        }

        if (!date || !datePattern.test(date)) {
            res.status(400).json({ error: 'Invalid date. Please provide a valid date in the format "DD/MM/YYYY".' });
            return;
        }

        if (!startTime || !timePattern.test(startTime)) {
            res.status(400).json({ error: 'Invalid startTime. Please provide a valid startTime in the format "HH:MM".' });
            return;
        }

        if (endTime) {
            // Calculate duration if endTime is present
            const duration = calculateDuration(startTime, endTime);
            finalhours = duration.hours
            finalminute = duration.minutes
            finalEndTime = endTime
        } else if (hours >= 0 && minute >= 0) {
            // Calculate end time if hours and minutes are present
            finalEndTime = calculateEndTime(startTime, hours, minute);
            finalhours = hours
            finalminute = minute
        } else {
            // Handle invalid request
            res.status(400).json({ error: 'Invalid request. Please provide endTime or hours and minutes.' });
            return;
        }

        const timeSpent = parseInt(finalhours) * 60 + parseInt(finalminute)

        const timeEntry = {
            user: req.userId,
            projectId,
            description,
            date,
            hours: finalhours,
            minute: finalminute,
            startTime,
            endTime: finalEndTime,
            timeSpent,
            billable: false,
            billed: false,
            tasks: [],
            created_at: new Date(),
            updated_at: new Date()
        };

        await TimeEntryCollection.insertOne(timeEntry);

        const responseData = {
            status: true,
            data: timeEntry
        }

        res.status(201).json(responseData);
    } catch (err) {
        console.error('Error creating time entry:', err);
        res.status(500).json({ error: 'Failed to create time entry' });
    }
});

//  Get a specific time entry by its ID.
TimeEntryRouter.get('/:id', async (req, res) => {
    try {
        const timeEntryId = req.params.id;

        const db = await connectToDatabase();
        const TimeEntryCollection = db.collection('time-entries')

        const timeEntry = await TimeEntryCollection.findOne({ _id: new ObjectId(timeEntryId) });
        if (!timeEntry) {
            res.status(404).json({ error: 'Time entry not found' });
            return;
        }
        res.json(timeEntry);
    } catch (err) {
        console.error('Error retrieving time entry:', err);
        res.status(500).json({ error: 'Failed to retrieve time entry' });
    }
})

// Get All Time Entry 
TimeEntryRouter.get('/', auth, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const TimeEntryCollection = db.collection('time-entries')

        const timeEntries = await TimeEntryCollection.find({}).toArray();
        res.status(200).json(timeEntries);
    } catch (err) {
        console.error('Error retrieving time entries:', err);
        res.status(500).json({ error: 'Failed to retrieve time entries' });
    }
});

// Choose an existing task 
TimeEntryRouter.put('/:id/choose-tasks', auth, async (req, res) => {
    try {
        const tid = req.params.id;
        const { tasks } = req.body;

        const db = await connectToDatabase();
        const TimeEntryCollection = db.collection('time-entries')


        const result = await TimeEntryCollection.findOneAndUpdate(
            { _id: new ObjectId(tid) },
            { $set: { tasks: tasks, updated_at: new Date() } }
        );

        if (!result.value) {
            res.status(404).json({ error: 'Time entry not found' });
            return;
        }

        res.status(200).json({ message: 'Time entry updated successfully' });

    } catch (err) {
        console.error('Error updating time entry:', err);
        res.status(500).json({ error: 'Failed to update time entry' });
    }
})

// Delete Time Entry API
TimeEntryRouter.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    try {
        const db = await connectToDatabase();
        const TimeEntryCollection = db.collection('time-entries')

        const result = await TimeEntryCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            res.status(404).json({ error: 'Time entry not found' });
            return;
        }

        res.status(200).json({ message: 'Time entry deleted successfully' });
    } catch (err) {
        console.error('Error deleting time entry:', err);
        res.status(500).json({ error: 'Failed to delete time entry' });
    }
})

module.exports = TimeEntryRouter
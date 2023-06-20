const express = require("express");
const connectToDatabase = require("../db/connection");
const auth = require("../Middleware/auth");
const { generateId } = require("../utils/basicFunctions");
const TaskRouter = express.Router();

TaskRouter.get('/:user/', auth, async (req, res) => {
    try {
        const hours = req.query.hours;
        const minute = req.query.minute;
        const userId = req.params.user


        const db = await connectToDatabase();
        const tasksCollection = db.collection('tasks');

        // Validate hours and minute
        if (!hours || !minute || isNaN(hours) || isNaN(minute)) {
            res.status(400).json({ error: 'Invalid hours and minute. Please provide valid numeric values for hours and minute.' });
            return;
        }

        const timeToFind = hours * 60 + minute;

        const tasks = await tasksCollection.find({ user: userId }).toArray();

        if (tasks.length <= 0) return res.status(400).json({ error: "Tasks not found" })


        const filteredTasks = tasks.map(task => {
            const filteredSubTasks = task.tasks.filter(subTask => {
                const { logTime } = subTask;
                const subTaskHours = logTime.hours;
                const subTaskMinutes = logTime.minute;

                return subTaskHours === parseInt(hours) && subTaskMinutes === parseInt(minute);
            });
            return { ...task, tasks: filteredSubTasks };
        });

        // Remove tasks with no matching subtasks
        const finalTasks = filteredTasks.filter(task => task.tasks.length > 0);


        const responseData = {
            status: true,
            data: finalTasks
        }

        res.status(200).json(responseData)
    } catch (err) {
        console.log('Failed to get tasks:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

TaskRouter.post('/', auth, async (req, res) => {
    try {
        const { name, tasks } = req.body;

        const db = await connectToDatabase();
        const tasksCollection = db.collection('tasks');

        const id = generateId()

        const task = {
            taskId: id,
            user: req.userId,
            name,
            tasks: [],
            created_at: new Date()
        };

        if (tasks && Array.isArray(tasks)) {
            tasks.forEach(entry => {
                const { taskName, logTime, taskDescp } = entry;

                // Validate taskName
                if (!taskName || typeof taskName !== 'string') {
                    res.status(400).json({ error: 'Invalid task name. Please provide a valid task name as a string.' });
                    return;
                }

                // Validate taskDescp
                if (!taskDescp || typeof taskDescp !== 'string') {
                    res.status(400).json({ error: 'Invalid task description. Please provide a valid task description as a string.' });
                    return;
                }

                if (!logTime || typeof logTime !== 'object' || Array.isArray(logTime)) {
                    res.status(400).json({ error: 'Invalid log time. Please provide a valid log time as an object.' });
                    return;
                }

                const { hours, minutes } = logTime;

                // Validate time spent
                const timeSpentInMinutes = hours * 60 + minutes;
                if (isNaN(timeSpentInMinutes) || timeSpentInMinutes <= 0) {
                    res.status(400).json({ error: 'Invalid time spent. Please provide a positive number for time spent.' });
                    return;
                }

                task.tasks.push({
                    taskName,
                    logTime: {
                        hours: parseInt(hours),
                        minute: parseInt(minutes)
                    }
                });
            });
        }

        await tasksCollection.insertOne(task)

        const responseData = {
            status: true,
            data: {
                taskId: task.taskId,
                name: task.name,
                project: task.projectId,
                tasks: task.tasks
            }
        }

        res.status(200).json(responseData)

    } catch (err) {
        console.log('Failed to add task in the project:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

module.exports = TaskRouter
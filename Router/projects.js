const express = require("express");
const connectToDatabase = require("../db/connection");
const auth = require("../Middleware/auth");
const { generateId } = require("../utils/basicFunctions");

const ProjectRouter = express.Router();

ProjectRouter.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        const db = await connectToDatabase();
        const projectsCollection = db.collection('projects');
        const projectId = generateId();
        const project = {
            projectId,
            user: req.userId,
            name,
            description,
            created_at: new Date()
        };

        await projectsCollection.insertOne(project)
        const responseData = {
            status: true,
            content: {
                data: {
                    id: projectId,
                    user: project.user,
                    name,
                    description,
                    created_at: project.created_at,
                },
            },
        };
        res.status(200).json(responseData)
    } catch (err) {
        console.error('Failed to add project:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

ProjectRouter.get('/', auth, async (req, res) => {
    try {
        const db = await connectToDatabase();
        const projectsCollection = db.collection('projects');

        const project = await projectsCollection.find({ user: req.userId }).toArray();

        const responseData = {
            status: true,
            data: project
        }

        res.status(200).json(responseData)

    } catch (error) {
        console.error('Failed to get project:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
})

module.exports = ProjectRouter
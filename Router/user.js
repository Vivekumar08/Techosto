const express = require("express");
const bcrypt = require('bcryptjs')
const connectToDatabase = require("../db/connection");
const { validateEmail, generateAccessToken, generateId } = require("../utils/basicFunctions");
const auth = require("../Middleware/auth");
const { ObjectId } = require("mongodb");
const UserRoouter = express.Router();

UserRoouter.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const salt = await bcrypt.genSalt();

        // Validate name, email, and password
        if (!name || name.length < 2) {
            res.status(400).json({
                status: false,
                errors: [
                    {
                        param: "name",
                        message: "Name should be at least 2 characters.",
                        code: "INVALID_INPUT"
                    }
                ]
            });
            return;
        }

        if (!email || !validateEmail(email)) {
            res.status(400).json({
                status: false,
                errors: [
                    {
                        param: "email",
                        message: "This email is not valid.",
                        code: "INVALID_EMAIL"
                    }
                ]
            });
            return;
        }

        if (!password || password.length < 6) {
            res.status(400).json({
                status: false,
                errors: [
                    {
                        param: "name",
                        message: "Name should be at least 2 characters.",
                        code: "INVALID_INPUT"
                    },
                    {
                        param: "password",
                        message: "Password should be at least 6 characters.",
                        code: "INVALID_INPUT"
                    }
                ]
            });
            return;
        }

        const db = await connectToDatabase();
        const collection = db.collection('user');

        const existEmail = await collection.findOne({ email: email })
        if (existEmail) {
            return res.status(401).json({
                status: false,
                errors: [
                    {
                        param: "email",
                        message: "User with this email address already exists.",
                        code: "RESOURCE_EXISTS"
                    }
                ]
            })
        }

        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            created_at: new Date(),
        };

        const result = await collection.insertOne(newUser);

        const accessToken = generateAccessToken(result.insertedId.toString());

        const responseData = {
            status: true,
            content: {
                data: {
                    id: result.insertedId.toString(),
                    name,
                    email,
                    created_at: newUser.created_at,
                },
                meta: {
                    access_token: accessToken,
                },
            },
        };

        res.status(200).cookie("access_token", accessToken).json(responseData);

    } catch (err) {
        console.error('Failed to signup user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

UserRoouter.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email
        if (!email || !validateEmail(email)) {
            res.status(400).json({
                status: false,
                errors: [
                    {
                        param: "email",
                        message: "This email is not valid.",
                        code: "INVALID EMAIL"
                    }
                ]
            });
            return;
        }

        const db = await connectToDatabase();
        const collection = db.collection('user');
        const user = await collection.findOne({ email });

        if (!user) {
            res.status(404).json({
                status: false,
                errors: [
                    {
                        param: "email",
                        message: "Please provide a valid email address.",
                        code: "INVALID_EMAIL"
                    }
                ]
            });
            return;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            res.status(401).json({
                status: false,
                errors: [
                    {
                        param: "password",
                        message: "The credentials you provided are invalid.",
                        code: "INVALID_CREDENTIALS"
                    }
                ]
            });
            return;
        }


        const accessToken = generateAccessToken(user._id.toString());


        const responseData = {
            status: true,
            content: {
                data: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    created_at: user.created_at,
                },
                meta: {
                    access_token: accessToken,
                },
            },
        };

        res.status(200).cookie("access_token", accessToken).json(responseData);

    } catch (err) {
        console.error('Failed to create role:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

UserRoouter.get('/me', auth, async (req, res) => {
    try {
        // Fetch the user details from the database
        const db = await connectToDatabase();
        const collection = db.collection('user');
        console.log(req.userId)
        const user = await collection.findOne({ _id: new ObjectId(req.userId) });
        if (!user) {
            res.status(404).json({
                status: false,
                errors: [
                    {
                        message: "You need to sign in to proceed.",
                        code: "NOT_SIGNEDIN"
                    }
                ]
            });
            return;
        }

        const responseData = {
            status: true,
            content: {
                data: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    created_at: user.created_at,
                },
            },
        };

        res.status(200).json(responseData);


    } catch (err) {
        console.error('Failed to create role:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = UserRoouter;
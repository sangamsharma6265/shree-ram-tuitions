const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection URL (Render Environment Variable se connect hoga)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shreeramtuitions';

// Debug log to check if Render environment variable is being detected
console.log("Checking MONGO_URI:", process.env.MONGO_URI ? "URI is present" : "URI is MISSING!");

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Schemas and Models for Persistent Storage
const tutorSchema = new mongoose.Schema({
    id: Number,
    name: String,
    email: String,
    phone: String,
    subjects: String,
    experience: String,
    location: String,
    date: String
});

const parentSchema = new mongoose.Schema({
    id: Number,
    name: String,
    email: String,
    phone: String,
    requirement: String,
    message: String,
    date: String
});

const Tutor = mongoose.model('Tutor', tutorSchema);
const Parent = mongoose.model('Parent', parentSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Admin Authentication Middleware
const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const [username, password] = Buffer.from(token, 'base64').toString().split(':');
        
        if (username === 'admin' && password === 'shreeram123') {
            return next(); 
        }
    }
    
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
    res.status(401).send('Authentication required. Access denied!');
};

// Google Search Console Verification Route
app.get('/google49939a4e776229a4.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'google49939a4e776229a4.html'));
});

// Sitemap Route
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

// Serve Main Pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/services.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'services.html'));
});

app.get('/contact.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

// Handle Tutor Registration & Save to MongoDB
app.post('/register-tutor', async (req, res) => {
    try {
        const newTutor = new Tutor({
            id: Date.now(),
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            subjects: req.body.subjects,
            experience: req.body.experience,
            location: req.body.location,
            date: new Date().toLocaleString()
        });

        await newTutor.save();

        res.send(`
            <body style="font-family: Arial; text-align: center; padding-top: 50px; background: #f8fafc;">
                <h1 style="color: #16a34a;">Registration Successful! 🎉</h1>
                <p>Thank you <b>${newTutor.name}</b>. Your details have been securely saved to Shree Ram Tuitions records.</p>
                <br>
                <a href="/" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Go Back Home</a>
                <a href="/admin" style="background: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Admin Dashboard</a>
            </body>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error saving data.");
    }
});

// Handle Parent/Contact Form Submission & Save to MongoDB
app.post('/contact', async (req, res) => {
    try {
        const newSubmission = new Parent({
            id: Date.now(),
            name: req.body.name,
            email: req.body.email || 'N/A',
            phone: req.body.phone,
            requirement: req.body.requirement || 'N/A',
            message: req.body.message || 'N/A',
            date: new Date().toLocaleString()
        });

        await newSubmission.save();

        res.send(`
            <body style="font-family: Arial; text-align: center; padding-top: 50px; background: #f8fafc;">
                <h1 style="color: #16a34a;">Request Submitted Successfully! 🎉</h1>
                <p>Thank you <b>${newSubmission.name}</b>. We have received your requirement and will contact you soon.</p>
                <br>
                <a href="/" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 50px;">Go Back Home</a>
            </body>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error saving data.");
    }
});

// Admin Dashboard Route (Tutors & Parents)
app.get('/admin', adminAuth, async (req, res) => {
    try {
        const tutors = await Tutor.find({});
        const parents = await Parent.find({});

        let tutorRows = '';
        if (tutors.length === 0) {
            tutorRows = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">No tutor registrations found yet.</td></tr>`;
        } else {
            tutors.forEach((tutor, index) => {
                tutorRows += `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px; text-align: center;">${index + 1}</td>
                        <td style="padding: 12px; font-weight: bold; color: #1e293b;">${tutor.name}</td>
                        <td style="padding: 12px; color: #475569;">${tutor.email}</td>
                        <td style="padding: 12px; color: #475569;">${tutor.phone}</td>
                        <td style="padding: 12px; color: #475569;">${tutor.subjects}</td>
                        <td style="padding: 12px; text-align: center; color: #475569;">${tutor.experience} Years</td>
                        <td style="padding: 12px; color: #475569;">${tutor.location}</td>
                    </tr>
                `;
            });
        }

        let parentRows = '';
        if (parents.length === 0) {
            parentRows = `<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">No parent inquiries found yet.</td></tr>`;
        } else {
            parents.forEach((parent, index) => {
                parentRows += `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px; text-align: center;">${index + 1}</td>
                        <td style="padding: 12px; font-weight: bold; color: #1e293b;">${parent.name}</td>
                        <td style="padding: 12px; color: #475569;">${parent.phone}</td>
                        <td style="padding: 12px; color: #475569;">${parent.requirement}</td>
                        <td style="padding: 12px; color: #475569;">${parent.message}</td>
                        <td style="padding: 12px; color: #475569; font-size: 13px;">${parent.date}</td>
                    </tr>
                `;
            });
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Admin Dashboard - Shree Ram Tuitions</title>
            </head>
            <body style="font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 30px;">
                <div style="max-width: 1100px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                        <h2 style="color: #1e293b; margin: 0;">Admin Dashboard 📊</h2>
                        <a href="/" style="background: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-size: 14px;">+ Home Page</a>
                    </div>

                    <!-- Parents Section -->
                    <h3 style="color: #ea580c; border-bottom: 2px solid #fdba74; padding-bottom: 8px; margin-top: 20px;">Parent Inquiries / Demo Requests 👨‍👩‍👦</h3>
                    <table style="width: 100%; border-collapse: collapse; text-align: left; margin-bottom: 40px;">
                        <thead>
                            <tr style="background: #fff7ed; color: #9a3412; border-bottom: 2px solid #fed7aa;">
                                <th style="padding: 12px; text-align: center;">#</th>
                                <th style="padding: 12px;">Name</th>
                                <th style="padding: 12px;">Phone</th>
                                <th style="padding: 12px;">Class / Requirement</th>
                                <th style="padding: 12px;">Message</th>
                                <th style="padding: 12px;">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${parentRows}
                        </tbody>
                    </table>

                    <!-- Tutors Section -->
                    <h3 style="color: #1e40af; border-bottom: 2px solid #93c5fd; padding-bottom: 8px;">Registered Tutors 👨‍🏫</h3>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: #f1f5f9; color: #334155; border-bottom: 2px solid #cbd5e1;">
                                <th style="padding: 12px; text-align: center;">#</th>
                                <th style="padding: 12px;">Name</th>
                                <th style="padding: 12px;">Email</th>
                                <th style="padding: 12px;">Phone</th>
                                <th style="padding: 12px;">Subjects</th>
                                <th style="padding: 12px; text-align: center;">Experience</th>
                                <th style="padding: 12px;">Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tutorRows}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading dashboard data.");
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running live at http://localhost:${PORT}`);
});
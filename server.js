const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Path for local JSON data file
const dataFilePath = path.join(__dirname, 'tutors.json');

// Helper function to read existing tutors
const getStoredTutors = () => {
    if (!fs.existsSync(dataFilePath)) {
        return [];
    }
    const fileData = fs.readFileSync(dataFilePath, 'utf-8');
    try {
        return JSON.parse(fileData);
    } catch (e) {
        return [];
    }
};

// Test Route
app.get('/test', (req, res) => {
    res.send("Server is working perfectly! 🚀");
});

// Serve Home Page (`index.html`)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle Tutor Registration & Save to Local JSON File
app.post('/register-tutor', (req, res) => {
    try {
        const newTutor = {
            id: Date.now(),
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            subjects: req.body.subjects,
            experience: req.body.experience,
            location: req.body.location,
            date: new Date().toLocaleString()
        };

        const tutors = getStoredTutors();
        tutors.push(newTutor);
        fs.writeFileSync(dataFilePath, JSON.stringify(tutors, null, 2));

        console.log("New Tutor saved locally: ", newTutor.name);

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

// Admin Dashboard Route to View All Registered Tutors
app.get('/admin', (req, res) => {
    const tutors = getStoredTutors();

    let tableRows = '';
    if (tutors.length === 0) {
        tableRows = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #64748b;">No tutor registrations found yet.</td></tr>`;
    } else {
        tutors.forEach((tutor, index) => {
            tableRows += `
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
                    <h2 style="color: #1e293b; margin: 0;">Admin Dashboard - Registered Tutors 👨‍🏫</h2>
                    <a href="/" style="background: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-size: 14px;">+ Register New Tutor</a>
                </div>
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
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running live at http://localhost:${PORT}`);
});
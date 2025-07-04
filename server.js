// server.js - BlipSend Backend (serving both frontend and API)

// Import necessary modules
const express = require('express'); // Express.js for creating the web server
const nodemailer = require('nodemailer'); // Nodemailer for sending emails via SMTP
const cors = require('cors'); // CORS middleware (less critical now for same-origin, but good to keep)
const path = require('path'); // Node.js built-in module for path manipulation

// Initialize Express app
const app = express();

// Middleware
// Enable CORS for all origins (useful during development or if frontend served from different domain)
app.use(cors());
// Parse JSON bodies of incoming requests
app.use(express.json());

// --- Serve Static Files (Your Frontend) ---
// This tells Express to serve static files from the current directory (where server.js is)
// This assumes index.html, CSS, and JS are in the same directory as server.js
app.use(express.static(__dirname)); // __dirname refers to the directory the current script is in

// Route to serve your index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Configuration for Nodemailer ---
// Get Gmail credentials from environment variables for security.
// These will be set on Render.
const GMAIL_USER = process.env.GMAIL_USER; // Your b1994mail@gmail.com
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD; // The 16-character App Password

// Create a Nodemailer transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Gmail SMTP host
    port: 587, // Standard port for secure SMTP
    secure: false, // Use TLS (true for 465, false for 587)
    auth: {
        user: GMAIL_USER, // Your Gmail email address
        pass: GMAIL_APP_PASSWORD // Your generated App Password
    },
    // Optional: Add logging for debugging (remove in production if not needed)
    logger: true,
    debug: true
});

// Test transporter verification (optional, good for initial setup check)
transporter.verify(function (error, success) {
    if (error) {
        console.error("Transporter verification failed:", error);
    } else {
        console.log("Transporter is ready to send messages.");
    }
});

// --- API Endpoint for Sending Email ---
app.post('/send-email', async (req, res) => {
    // Destructure email details from the request body
    const { to, subject, text } = req.body;

    // Basic validation
    if (!to || !subject || !text) {
        return res.status(400).json({ error: 'Recipient, subject, and message are required.' });
    }

    // Ensure environment variables are set
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        console.error('Email credentials not set in environment variables!');
        return res.status(500).json({ error: 'Server configuration error: Email credentials missing.' });
    }

    // Define mail options
    const mailOptions = {
        from: GMAIL_USER, // Sender email address (your Gmail account)
        to: to,           // Recipient email address
        subject: subject, // Email subject
        text: text        // Plain text body of the email
        // html: '<p>You can also send <b>HTML</b> content here!</p>' // Optional: HTML body
    };

    try {
        // Send the email
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        // Response to the frontend
        res.status(200).json({ message: 'Email sent successfully!', messageId: info.messageId });
    } catch (error) {
        console.error('Error sending email:', error);
        // Respond with an error message
        res.status(500).json({ error: 'Failed to send email. Please try again later.' });
    }
});


// --- Start the Server ---
// Render automatically sets the PORT environment variable.
// Use 3000 for local development if PORT is not set.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`BlipSend Backend listening on port ${PORT}`);
});

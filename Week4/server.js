const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session'); // The new session module

const app = express();
const PORT = 3000;

// Database Connection
const dbURI = 'mongodb://127.0.0.1:27017/week4db';
mongoose.connect(dbURI)
    .then(() => console.log('Database connected successfully!'))
    .catch((err) => console.log('Database connection error: ', err));

// Middleware for parsing forms and serving HTML/CSS
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Configure the Session Middleware
app.use(session({
    secret: 'super_secret_key_for_bit3208', // This locks the session data
    resave: false,
    saveUninitialized: false
}));

// Handle the Registration POST request (From earlier)
app.post('/register', (req, res) => {
    const incomingData = req.body;
    console.log("--- New Registration Attempt ---");
    console.log("Username: ", incomingData.username);
    console.log("Email: ", incomingData.email);
    console.log("Password: ", incomingData.password);
    
    // Redirect them to login after registering
    res.send('<h2>Registration data received successfully! Check your terminal.</h2><br><a href="/login.html">Go to Login</a>');
});

// Handle the Login POST request
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // The debug line to check for hidden spaces
    console.log(`Login Attempt -> Username: '${username}', Password: '${password}'`);

    // Week 4 Simple Authentication Logic
    if (username === 'admin' && password === '1234') {
        // Success! Save the user to the session
        req.session.user = username;
        // Redirect them to the secure dashboard route
        res.redirect('/secure-dashboard');
    } else {
        res.send('<h2>Access Denied: Invalid Credentials.</h2><a href="/login.html">Try Again</a>');
    }
});

// Protect the Dashboard Route
app.get('/secure-dashboard', (req, res) => {
    // Check if the user exists in the session memory
    if (req.session.user) {
        // If they are logged in, send them the dashboard file
        res.sendFile(__dirname + '/dashboard.html');
    } else {
        // If they are NOT logged in, kick them back to the login page
        res.redirect('/login.html');
    }
});

// Handle Logout
app.get('/logout', (req, res) => {
    req.session.destroy(); // Destroy the session memory
    res.redirect('/login.html');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running! Test it by visiting http://localhost:${PORT}/login.html`);
});
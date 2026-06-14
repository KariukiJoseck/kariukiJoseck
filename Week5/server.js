const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./models/User'); // 1. Import your new Database Model

const app = express();
const PORT = 3000;

// Database Connection
const dbURI = 'mongodb://127.0.0.1:27017/week5db';
mongoose.connect(dbURI)
    .then(() => console.log('Database connected successfully!'))
    .catch((err) => console.log('Database connection error: ', err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Configure Sessions
app.use(session({
    secret: 'super_secret_key_for_bit3208',
    resave: false,
    saveUninitialized: false
}));

// ---------------------------------------------------------
// CRUD OPERATION: CREATE (Registering a User)
// ---------------------------------------------------------
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirm_password } = req.body;

        // 1. Backend Validation
        if (password !== confirm_password) {
            return res.send('<h2>Passwords do not match.</h2><a href="/register.html">Try Again</a>');
        }

        // 2. READ: Check if a user with this username already exists
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.send('<h2>Username already taken.</h2><a href="/register.html">Try a different one</a>');
        }

        // 3. CREATE: Instantiate a new User document and save it to MongoDB
        const newUser = new User({
            username: username,
            email: email,
            password: password // Note: In production, we would hash this with bcrypt!
        });
        
        await newUser.save(); // This writes the data to the hard drive
        
        console.log(`New user created in database: ${username}`);
        res.send('<h2>Registration successful!</h2><br><a href="/login.html">Go to Login</a>');

    } catch (error) {
        console.error(error);
        res.send('<h2>Server Error during registration.</h2>');
    }
});

// ---------------------------------------------------------
// CRUD OPERATION: READ (Logging a User In)
// ---------------------------------------------------------
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`Login Attempt -> Username: '${username}'`);

        // READ: Search the database for this specific username
        const userRecord = await User.findOne({ username: username });

        // If the user exists AND the passwords match
        if (userRecord && userRecord.password === password) {
            // Success! Save the user to the session
            req.session.user = userRecord.username;
            res.redirect('/secure-dashboard');
        } else {
            // Failure: Either username wasn't found, or password was wrong
            res.send('<h2>Access Denied: Invalid Credentials.</h2><a href="/login.html">Try Again</a>');
        }

    } catch (error) {
        console.error(error);
        res.send('<h2>Server Error during login.</h2>');
    }
});
// ---------------------------------------------------------
// API: Get Current Logged-in User
// ---------------------------------------------------------
app.get('/api/current-user', (req, res) => {
    if (req.session.user) {
        res.json({ username: req.session.user });
    } else {
        res.status(401).json({ error: 'Not authorized' });
    }
});

// ---------------------------------------------------------
// CRUD OPERATION: READ (Fetch all records)
// ---------------------------------------------------------
app.get('/api/all-users', async (req, res) => {
    // Let errors propagate to Express error handler instead of silently catching them here
    // Find all users, but exclude the password field for security!
    const users = await User.find({}, '-password');
    res.json(users);
});
// Protect the Dashboard Route
app.get('/secure-dashboard', (req, res) => {
    if (req.session.user) {
        res.sendFile(__dirname + '/dashboard.html');
    } else {
        res.redirect('/login.html');
    }
});
// ---------------------------------------------------------
// CRUD OPERATION: UPDATE (Change Password)
// ---------------------------------------------------------
app.post('/update-password', async (req, res) => {
    if (!req.session.user) return res.redirect('/login.html'); // Security check

    try {
        const { new_password } = req.body;
        
        // Find the logged-in user and update their password
        await User.findOneAndUpdate(
            { username: req.session.user }, 
            { password: new_password }
        );
        
        console.log(`Password updated for user: ${req.session.user}`);
        res.send('<h2>Password Updated Successfully!</h2><br><a href="/secure-dashboard">Back to Dashboard</a>');
    } catch (error) {
        console.error(error);
        res.send('<h2>Error updating password.</h2>');
    }
});

// ---------------------------------------------------------
// CRUD OPERATION: DELETE (Remove Account)
// ---------------------------------------------------------
app.post('/delete-account', async (req, res) => {
    if (!req.session.user) return res.redirect('/login.html'); // Security check

    try {
        const userToDelete = req.session.user;

        // Find the user and permanently delete their document
        await User.findOneAndDelete({ username: userToDelete });
        
        // Destroy their session so they are logged out
        req.session.destroy(); 
        
        console.log(`Account deleted for user: ${userToDelete}`);
        res.send('<h2>Account Permanently Deleted.</h2><br><a href="/register.html">Register a new account</a>');
    } catch (error) {
        console.error(error);
        res.send('<h2>Error deleting account.</h2>');
    }
});
// Handle Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running! Visit http://localhost:${PORT}/register.html to start.`);
});
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require('bcryptjs');
const User = require("./models/User"); // 1. Import your new Database Model

const app = express();
const PORT = 3000;

// Database Connection
const dbURI = "mongodb://127.0.0.1:27017/week6db";
mongoose
  .connect(dbURI)
  .then(() => console.log("Database connected successfully!"))
  .catch((err) => console.log("Database connection error: ", err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Configure Sessions
app.use(
  session({
    secret: "super_secret_key_for_bit3208",
    resave: false,
    saveUninitialized: false,
  }),
);

// ---------------------------------------------------------
// SECURE CREATE: Hash Passwords & Save Role
// ---------------------------------------------------------
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirm_password, role } = req.body;

        if (password !== confirm_password) {
            return res.send('<h2>Passwords do not match.</h2><a href="/register.html">Try Again</a>');
        }

        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.send('<h2>Username already taken.</h2><a href="/register.html">Try a different one</a>');
        }

        // HASH THE PASSWORD
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username: username,
            email: email,
            password: hashedPassword, // Store the scrambled hash!
            role: role // Store their selected rank
        });
        
        await newUser.save(); 
        
        console.log(`New ${role} created: ${username}`);
        res.send('<h2>Registration successful!</h2><br><a href="/login.html">Go to Login</a>');

    } catch (error) {
        console.error(error);
        res.send('<h2>Server Error during registration.</h2>');
    }
});

// ---------------------------------------------------------
// SECURE READ: Verify Hash & Route by Role
// ---------------------------------------------------------
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const userRecord = await User.findOne({ username: username });

        if (userRecord) {
            // Compare the plain text login with the hashed database password
            const isMatch = await bcrypt.compare(password, userRecord.password);

            if (isMatch) {
                // Save both the username AND their role to the session
                req.session.user = userRecord.username;
                req.session.role = userRecord.role;

                // MULTI-USER ROUTING
                if (userRecord.role === 'Administrator') {
                    res.redirect('/admin-dashboard.html');
                } else if (userRecord.role === 'Lecturer') {
                    res.redirect('/lecturer-dashboard.html');
                } else {
                    res.redirect('/student-dashboard.html');
                }
            } else {
                res.send('<h2>Access Denied: Invalid Credentials.</h2><a href="/login.html">Try Again</a>');
            }
        } else {
            res.send('<h2>Access Denied: User not found.</h2><a href="/login.html">Try Again</a>');
        }

    } catch (error) {
        console.error(error);
        res.send('<h2>Server Error during login.</h2>');
    }
});
// ---------------------------------------------------------
// PROTECTED DASHBOARD ROUTES
// ---------------------------------------------------------

// 1. Admin Portal Route
app.get('/admin-dashboard.html', (req, res) => {
    // Check if logged in AND if role is Administrator
    if (req.session.user && req.session.role === 'Administrator') {
        res.sendFile(__dirname + '/admin-dashboard.html');
    } else {
        res.send('<h2>Access Denied. Administrators only.</h2><br><a href="/login.html">Return to Login</a>');
    }
});

// 2. Lecturer Portal Route
app.get('/lecturer-dashboard.html', (req, res) => {
    // Check if logged in AND if role is Lecturer
    if (req.session.user && req.session.role === 'Lecturer') {
        res.sendFile(__dirname + '/lecturer-dashboard.html');
    } else {
        res.send('<h2>Access Denied. Lecturers only.</h2><br><a href="/login.html">Return to Login</a>');
    }
});

// 3. Student Portal Route
app.get('/student-dashboard.html', (req, res) => {
    // Check if logged in AND if role is Student
    if (req.session.user && req.session.role === 'Student') {
        res.sendFile(__dirname + '/student-dashboard.html');
    } else {
        res.send('<h2>Access Denied. Students only.</h2><br><a href="/login.html">Return to Login</a>');
    }
});
// ---------------------------------------------------------
// API: Get Current Logged-in User
// ---------------------------------------------------------
app.get("/api/current-user", (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user, role: req.session.role });
  } else {
    res.status(401).json({ error: "Not authorized" });
  }
});

// ---------------------------------------------------------
// CRUD OPERATION: READ (Fetch all records)
// ---------------------------------------------------------
app.get("/api/all-users", async (req, res) => {
  // Let errors propagate to Express error handler instead of silently catching them here
  // Find all users, but exclude the password field for security!
  const users = await User.find({}, "-password");
  res.json(users);
});
// Protect the Dashboard Route
app.get("/secure-dashboard", (req, res) => {
  if (req.session.user) {
    res.sendFile(__dirname + "/dashboard.html");
  } else {
    res.redirect("/login.html");
  }
});
// ---------------------------------------------------------
// CRUD OPERATION: UPDATE (Change Password)
// ---------------------------------------------------------
app.post("/update-password", async (req, res) => {
  if (!req.session.user) return res.redirect("/login.html"); // Security check

  try {
    const { new_password } = req.body;

    // Find the logged-in user and update their password
    await User.findOneAndUpdate(
      { username: req.session.user },
      { password: new_password },
    );

    console.log(`Password updated for user: ${req.session.user}`);
    res.send(
      '<h2>Password Updated Successfully!</h2><br><a href="/secure-dashboard">Back to Dashboard</a>',
    );
  } catch (error) {
    console.error(error);
    res.send("<h2>Error updating password.</h2>");
  }
});

// ---------------------------------------------------------
// CRUD OPERATION: DELETE (Remove Account)
// ---------------------------------------------------------
app.post("/delete-account", async (req, res) => {
  if (!req.session.user) return res.redirect("/login.html"); // Security check

  try {
    const userToDelete = req.session.user;

    // Find the user and permanently delete their document
    await User.findOneAndDelete({ username: userToDelete });

    // Destroy their session so they are logged out
    req.session.destroy();

    console.log(`Account deleted for user: ${userToDelete}`);
    res.send(
      '<h2>Account Permanently Deleted.</h2><br><a href="/register.html">Register a new account</a>',
    );
  } catch (error) {
    console.error(error);
    res.send("<h2>Error deleting account.</h2>");
  }
});
// Handle Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login.html");
});

// Start the server
app.listen(PORT, () => {
  console.log(
    `Server is running! Visit http://localhost:${PORT}/register.html to start.`,
  );
});

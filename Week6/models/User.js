const mongoose = require('mongoose');

// Define the structure of our User data
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true // Prevents two users from having the same username
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

// Compile the schema into a model and export it
module.exports = mongoose.model('User', userSchema);
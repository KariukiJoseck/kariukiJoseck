const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        required: true, 
        enum: ['Student', 'Lecturer', 'Administrator'], 
        default: 'Student' 
    }
});

module.exports = mongoose.model('User', userSchema);
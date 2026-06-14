const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Database Connection String
const dbURI = 'mongodb://127.0.0.1:27017/week3db';

// Connect to MongoDB
mongoose.connect(dbURI)
    .then(() => console.log('Database connected successfully!'))
    .catch((err) => console.log('Database connection error: ', err));

app.get('/', (req, res) => {
    res.send('<h1>Hello World! Welcome to Week 1</h1>');
});

app.listen(PORT, () => {
    console.log(`Server is running! Test it by visiting http://localhost:${PORT}`);
});
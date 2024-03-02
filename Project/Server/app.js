const express = require('express');
// body-parser is not needed if you're using Express 4.16+
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

// Middleware
// For Express 4.16+ use express.json() and express.urlencoded()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'client')));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.redirect('index.html');
});

app.get('/grabavatar', (req, res) => {
    res.render('grab', {
        flaskApiUrl: '192.168.1.97:5000/generate-image' // Your actual Flask API URL
    });
});
// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
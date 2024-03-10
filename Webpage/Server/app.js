const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const pool = require('./database');
const bcrypt = require('bcrypt');
const saltRounds = 10; // for bcrypt hashing
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'client')));
app.use(session({
    secret: 'secretsecretsecret', // A secret key for session encoding
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 3600000 } // Cookie settings
  }));

app.use(express.static(path.join(__dirname, '../Client')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.set('view engine', 'ejs');


function checkAuthenticated(req, res, next) { // Put in route handler to require auth
    if (req.session && req.session.userId) { 
      return next();
    }
    return res.redirect('/login');
  }

//Get routes
app.get('/', (req, res) => {
    res.redirect('index.html');
});

app.get('/createAccount', (req,res) => {
    res.redirect('createAccount.html');
})

app.get('/users', async (req, res) => {
    try {
        const [rows, fields] = await pool.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

app.get('/grabavatar', (req, res) => {
    res.render('grab', {
        flaskApiUrl: '192.168.1.97:5000/generate-image' // Your actual Flask API URL
    });
});


app.get('/login', (req, res) => {
    res.redirect('index.html');
});

app.get('/grab', checkAuthenticated, (req, res) => {
    res.render('grab', { username: req.session.username });
});


//Post Routes  
app.post('/createAccount', async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      // Insert into the database
      const query = `INSERT INTO users (username, email, password, timeCreated) VALUES (?, ?, ?, NOW())`;
      const [result] = await pool.execute(query, [username, email, hashedPassword]);
  
      console.log(result); // Log the result to the console for debugging
      res.redirect('/index.html?accountCreated=true');

    } catch (error) {
      console.error('Error creating account:', error);
      res.status(500).send('Error creating account');
    }
  });


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Query the database for a user with the provided username or email
        const query = 'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1';
        const [users] = await pool.execute(query, [username, username]);
        
        if (users.length > 0) {
            const user = users[0];
            
            // Compare the provided password with the hashed password in the database
            const match = await bcrypt.compare(password, user.password);
            
            if (match) {
                // Passwords match
                req.session.userId = user.id; // Example of storing user ID
                req.session.username = user.username;
                res.render('grab', { username: req.session.username });
            } else {
                // Passwords do not match, redirect back to login with an error
                res.redirect('/index.html?error=invalidcredentials');
            }
        } else {
            // No user found with the provided username/email
            res.redirect('/index.html?error=nouserfound');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Server error during login');
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout Error:', err);
            res.status(500).send('Error while logging out');
        } else {
            res.redirect('/index.html'); // Redirect to login or home page after logout
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
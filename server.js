const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = 3000;

// Connect to the SQLite database file
const db = new sqlite3.Database('./blog.db', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
}));

// Initialize the database with tables and admin user
db.serialize(async () => {
    db.run("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, title TEXT, content TEXT, date TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");

    // Check if the admin user already exists
    db.get("SELECT * FROM users WHERE username = ?", [process.env.ADMIN_USERNAME], async (err, row) => {
        if (err) {
            console.error(err.message);
        } else if (!row) {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, saltRounds);
            db.run("INSERT INTO users (username, password) VALUES (?, ?)", [process.env.ADMIN_USERNAME, hashedPassword]);
        }
    });
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}
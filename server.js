const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Update with your Hostinger MySQL database details
const connection = mysql.createConnection({
    host: process.env.DB_HOST,  // e.g., 'mysql.hostinger.com'
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to the MySQL database.');

    // Initialize the database with tables and admin user
    const createPostsTable = `
        CREATE TABLE IF NOT EXISTS posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255),
            content TEXT,
            date DATE
        )`;
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE,
            password VARCHAR(255)
        )`;

    connection.query(createPostsTable, (err) => {
        if (err) throw err;
        console.log('Posts table created or already exists.');
    });

    connection.query(createUsersTable, (err) => {
        if (err) throw err;
        console.log('Users table created or already exists.');

        // Check if the admin user already exists
        const checkAdminUser = "SELECT * FROM users WHERE username = ?";
        connection.query(checkAdminUser, [process.env.ADMIN_USERNAME], async (err, results) => {
            if (err) throw err;
            if (results.length === 0) {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, saltRounds);
                const insertAdminUser = "INSERT INTO users (username, password) VALUES (?, ?)";
                connection.query(insertAdminUser, [process.env.ADMIN_USERNAME, hashedPassword], (err) => {
                    if (err) throw err;
                    console.log('Admin user created.');
                });
            }
        });
    });
});

app.use(bodyParser.json());
app.use(express.static(__dirname));
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
}));

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

// Displaying posts
app.get('/posts', (req, res) => {
    const query = 'SELECT * FROM posts ORDER BY date DESC';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({ success: false, error: 'Error fetching posts' });
        } else {
            res.json({ success: true, posts: results });
        }
    });
});

// Searching posts
app.get('/search-posts', (req, res) => {
    const { title, date } = req.query;
    let query = "SELECT * FROM posts WHERE 1=1";
    let params = [];

    if (title) {
        query += " AND title LIKE ?";
        params.push(`%${title}%`);
    }

    if (date) {
        query += " AND date = ?";
        params.push(date);
    }

    connection.query(query, params, (err, results) => {
        if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
        }
        res.json({ success: true, posts: results });
    });
});

// Adding posts
app.post('/add-post', isAuthenticated, (req, res) => {
    const { title, content } = req.body;
    const date = new Date().toISOString().split('T')[0];
    const query = "INSERT INTO posts (title, content, date) VALUES (?, ?, ?)";
    connection.query(query, [title, content, date], (err) => {
        if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// Deleting posts
app.delete('/delete-post/:id', isAuthenticated, (req, res) => {
    const postId = req.params.id;
    const query = "DELETE FROM posts WHERE id = ?";
    connection.query(query, [postId], (err) => {
        if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// Editing posts
app.put('/edit-post/:id', isAuthenticated, (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;
    const query = 'UPDATE posts SET title = ?, content = ? WHERE id = ?';
    connection.query(query, [title, content, postId], (error, results) => {
        if (error) {
            console.error('Error editing post:', error);
            res.status(500).json({ success: false, error: 'Error editing post' });
        } else {
            res.json({ success: true });
        }
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = "SELECT * FROM users WHERE username = ?";
    connection.query(query, [username], async (err, results) => {
        if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
        }
        if (results.length > 0 && await bcrypt.compare(password, results[0].password)) {
            req.session.user = results[0];
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
        }
        res.json({ success: true });
    });
});

app.get('/check-login', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true });
    } else {
        res.json({ loggedIn: false });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
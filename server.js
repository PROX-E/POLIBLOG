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
// displaying posts
app.get('/posts', (req, res) => {
    const query = 'SELECT * FROM posts ORDER BY date DESC'; // Ensure posts are ordered by date in descending order
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error fetching posts:', error);
            res.status(500).json({ success: false, error: 'Error fetching posts' });
        } else {
            res.json({ success: true, posts: results });
        }
    });
});
// searching posts
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

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
        }
        res.json({ success: true, posts: rows });
    });
});
// adding posts
app.post('/add-post', isAuthenticated, (req, res) => {
    const { title, content } = req.body;
    const date = new Date().toISOString().split('T')[0];
    db.run("INSERT INTO posts (title, content, date) VALUES (?, ?, ?)", [title, content, date], function(err) {
        if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
        }
        res.json({ success: true });
    });
});
// deleting posts
app.delete('/delete-post/:id', isAuthenticated, (req, res) => {
    const postId = req.params.id;
    db.run("DELETE FROM posts WHERE id = ?", postId, function(err) {
        if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
        }
        res.json({ success: true });
    });
});
// editing posts
app.put('/edit-post/:id', (req, res) => {
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
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
        if (err) {
            res.status(500).json({ success: false, message: err.message });
            return;
        }
        if (row && await bcrypt.compare(password, row.password)) {
            req.session.user = row;
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
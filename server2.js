const express = require('express');
const app = express();
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');

// Define the schema and model for the User
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    username: String,
    password: String,
    country: String
});
const User = mongoose.model('User', userSchema);

// Read the configuration file
const configData = fs.readFileSync('config.json');
const config = JSON.parse(configData);

// Access MongoDB configuration
const mongoConfig = config.mongo;
const { username, password, host, port, database } = mongoConfig;

// Extract session secret
const sessionSecret = config.sessionSecret || 'default_session_secret';


// Connect to MongoDB
mongoose.connect(`mongodb://${username}:${password}@${host}:${port}/${database}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB Connected....');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    store: MongoStore.create({
        mongoUrl: `mongodb://${username}:${password}@${host}:${port}/${database}`
    })
}));

// Serve login page
// app.get('/', (req, res) => {
//     res.send(`
//         <form action="/login" method="post">
//             <label for="username">Username:</label><br>
//             <input type="text" id="username" name="username"><br>
//             <label for="password">Password:</label><br>
//             <input type="password" id="password" name="password"><br><br>
//             <input type="submit" value="Login">
//         </form>
//         <br>
//         <a href="/create">Create User</a>
//     `);
// });


// Serve static files from the "public" directory
app.use(express.static('public'));

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// // Serve create user page
// app.get('/create', (req, res) => {
//     res.send(`
//         <h2>Create User</h2>
//         <form action="/create" method="post">
//             <label for="username">Username:</label><br>
//             <input type="text" id="username" name="username"><br>
//             <label for="password">Password:</label><br>
//             <input type="password" id="password" name="password"><br><br>
//             <input type="submit" value="Create User">
//         </form>
//     `);
// });



// Handle registration form submission
app.post('/register', async (req, res) => {
    const { firstName, lastName, email, username, password, repeatPassword, country } = req.body;

    // Check if passwords match
    if (password !== repeatPassword) {
        return res.status(400).send('Passwords do not match');
    }

    try {
        // Check if the username is already taken
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Username is already taken');
        }

        // Create the new user
        await User.create({ firstName, lastName, email, username, password, country });
        res.send(`
        <p> User Created Successfully!</p>
        <a href="/index.html">Login</a>
        `);
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).send('Server error');
    }
});

// Handle create user form submission
// app.post('/create', async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         await User.create({ username, password });
//         res.send('User created successfully');
//     } catch (err) {
//         console.error('Error creating user:', err);
//         res.status(500).send('Server error');
//     }
// });

// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (user) {
            req.session.userId = user._id;
            res.redirect('/dashboard');
        } else {
            res.send('Invalid username or password');
        }
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).send('Server error');
    }
});

// Dashboard route (requires authentication)
app.get('/dashboard', (req, res) => {
    if (req.session.userId) {
        res.send('Welcome to the dashboard!');
    } else {
        res.redirect('/login');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

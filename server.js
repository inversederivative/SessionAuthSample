const express = require('express');
const app = express();
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');

// Define an asynchronous function to connect to MongoDB
async function connectToDatabase() {
    try {
        await mongoose.connect('mongodb://myuser:mypassword@localhost:27017/mydatabase', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected....');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
    }
}

// Call the async function to connect to the database
connectToDatabase();

// Express middleware and routes
app.get('/', (req, res) => {
    res.send('<h1>Hello World!</h1>');
});

const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Express middleware for session management
app.use(session({
    secret: 'fiwafhiwfwhvuwvu9hvvvwv', // Never ever share this secret in production, keep this in separate file on environmental variable
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    store: MongoStore.create({
        mongoUrl: 'mongodb://myuser:mypassword@localhost:27017/mydatabase'
    })
}));

// Express route for login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ email: username });
        req.session.userId = user.id;

        console.log(req.session);

        res.redirect('/dashboard');

    } catch (err) {
        console.log(err);
        res.json({ msg: 'Server Error! Please reload page' });
    }
});

// Exporting authentication middleware
module.exports.authentication = async (req, res, next) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.redirect('/login?q=session-expired');
    }
    try {
        let user = await User.findById(userId);
        if (!user) {
            return res.redirect('/login?q=session-expired');
        }
        next();
    } catch (err) {
        console.log(err);
        res.json({ msg: 'Server error. Please reload page after sometime' });
    }
};

// Start the Express server
app.listen(3000, () => console.log(`Server running on 3000`));

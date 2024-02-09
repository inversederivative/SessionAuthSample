const express = require('express');
const mysqlx = require('@mysql/xdevapi');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session); // For storing session via MySQL
const bcrypt = require('bcryptjs'); // For hashing passwords
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const {join} = require("path");
const favicon = require('serve-favicon');

const PORT = process.env.PORT || 3030;

// Setup HTTPS server with Certificate
const httpsOptions = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
}
const app = express();
const server = https.createServer(httpsOptions, app);

// Read the configuration file
const configData = fs.readFileSync('config.json');
const config = JSON.parse(configData);

// Access MySQLx configuration
const mysqlxConfig = config.mysqlx;
const { username, password, host, port, schema, collection } = mysqlxConfig;

// Extract session secret
const sessionSecret = config.secret || 'default_session_secret';

const options = {
    connectionLimit: 10,
    password: mysqlxConfig.password,
    user: mysqlxConfig.username,
    database: mysqlxConfig.schema,
    host: mysqlxConfig.host,
    port: 3306, // Note that for MySQLStore, we'll be using MySQL, but not MySQLx (i.e. 33060)
    createDatabaseTable: false,
    clearExpired: true,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
}

// For Storing Sessions with MySQL
const sessionStore = new MySQLStore(options);

// Configure middleware
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    // This is The default one is just called ID, and the reason you want to give it a name is just to make it
    // different, so people don t know right away just from the cookie name you are using this library.
    name: 'RandomSessionName',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    secret: sessionSecret,
    cookie: {
        httponly: true, // JavaScript cannot access your cookie
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: true,
        secure: true
    }
}));

// Setup Favicon
app.use(favicon(__dirname + '/static/favicon.ico'));

/////////////////////////////////////
///////         GETS           //////
/////////////////////////////////////
app.get('/', (req, res) => {
    // If user is logged in, redirect to dashboard
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        console.log("UserID not valid. Redirecting to index.html")
        res.sendFile(join(__dirname, 'static', 'index.html'));
    }
});

app.get('/index.html', async (req, res) => {
    // Check if the user is logged in\
    if (req.session.userId) {
        // If the user is logged in, redirect to Dashboard
        res.redirect('/dashboard');
    } else {
        // If not logged in, serve the index.html
        res.sendFile(join(__dirname, 'static', 'index.html'));
    }
});

app.get('/Register.html', async (req, res) => {
    // Check if the user is logged in\
    if (req.session.userId) {
        res.redirect('/dashboard');
        console.log("User tried to access Register while logged in!");
        // If the user is logged in, serve the dashboard

    } else {
        // If not logged in, redirect to /
        res.sendFile(join(__dirname, 'static', 'Register.html'));
    }
});

app.get('/register', async (req, res) => {
    if (req.session.userId) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/Register.html');
    }
});

app.get('/Dashboard.html', async (req, res) => {
    // Check if the user is logged in
    if (req.session.userId) {
        // If the user is logged in, serve the dashboard
        res.sendFile(join(__dirname, 'static', 'Dashboard.html'));
    } else {
        // If not logged in, redirect to /
        console.log("User tried to access Dashboard without a valid session!");
        res.redirect('/');
    }
});

app.get('/dashboard', async (req, res) => {
    if (req.session.userId) {
        res.redirect('/Dashboard.html');
    } else {
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    // Destroy the session (invalidate the user's session)
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('Server error');
        }
        // Redirect the user to the login page after logout
        res.redirect('/');
    });
});

/////////////////////////////////////
/////////    GETS end   /////////////
/////////////////////////////////////


/////////////////////////////////////
///////        POSTS           //////
/////////////////////////////////////
app.post('/register', async (req, res) => {
    const { firstName, lastName, email, username, password, repeatPassword, country } = req.body;

    // Check if passwords match
    if (password !== repeatPassword) {
        return res.status(400).send('Passwords do not match');
    }

    let resultAll;
    try {
        // Check if the username is already taken
        const session = await mysqlx.getSession({
            user: mysqlxConfig.username,
            password: mysqlxConfig.password,
            host: mysqlxConfig.host,
            port: mysqlxConfig.port
        });

        console.log('MySQLx Connected....');

        const schema = session.getSchema(mysqlxConfig.schema);
        const users = schema.getCollection(mysqlxConfig.collection);
        const result = await users.find('username = :username').bind('username', username).execute();

        let resultAll = result.fetchAll();

        if (resultAll.length > 0) {
            return res.status(400).send('Username is already taken');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Change to collection based
        // Insert the new user into the database
        await users.add([{firstName, lastName, email, username, password: hashedPassword, country}]).execute();

        res.send(`
        <p>User Created Successfully!</p>
        <a href="/index.html">Login</a>
    `);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send(`Server error ${error}`);
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const session = await mysqlx.getSession({
            user: mysqlxConfig.username,
            password: mysqlxConfig.password,
            host: mysqlxConfig.host,
            port: mysqlxConfig.port
        });
        if (session)
        {
            console.log("MySQL Server accessed during Login!");
        }
        const schema = session.getSchema(mysqlxConfig.schema);
        const users = schema.getCollection(mysqlxConfig.collection);


        // Find the user based on the username
        const result = await users.find('username = :username').bind('username', username).execute();
        let resultAll = result.fetchAll();

        // Check if a user with the provided username exists and if the password matches
        if (resultAll.length > 0) {
            const user = resultAll[0];
            const hashedPassword = user.password; // Assuming the password is stored as a hashed value in the database

            // Compare the provided password with the hashed password
            const passwordMatch = await bcrypt.compare(password, hashedPassword);

            if (passwordMatch) {
                // Set the userId in the session
                req.session.userId = user._id; // Assuming the user id is stored in a field named 'id' in the database
                res.redirect('/dashboard');
            } else {
                res.send('Invalid username or password');
            }
        } else {
            res.send('Invalid username or password');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('Server error');
    }
});

/////////////////////////////////////
/////////   POSTS end   /////////////
/////////////////////////////////////


/////////////////////////////////////
/////// CSS, JS, JPG, PNG, ETC //////
/////////////////////////////////////

app.get('/index.css', async (req, res) => {
    res.sendFile(join(__dirname, 'static', 'index.css'));
});
app.get('/Register.css', async (req, res) => {
    if (req.session.userId) {
        // If the user is logged in, serve the dashboard
        console.log("User tried to access Register while logged in!");
        res.redirect('/dashboard');
    } else {
        // If not logged in, redirect to /
        res.sendFile(join(__dirname, 'static', 'Register.css'));
    }
    res.sendFile(join(__dirname, 'static', 'Register.css'));
});
app.get('/Dashboard.css', async (req, res) => {
    if (req.session.userId) {
        // If the user is logged in, serve the dashboard
        res.sendFile(join(__dirname, 'static', 'Dashboard.css'));
    } else {
        // If not logged in, redirect to /
        console.log("User tried to access Dashboard without a valid session!");
        res.redirect('/');
    }
});
app.get('/Dashboard.js', async (req, res) => {
    if (req.session.userId) {
        // If the user is logged in, serve the dashboard
        res.sendFile(join(__dirname, 'static', 'Dashboard.js'));
    } else {
        // If not logged in, redirect to /
        console.log("User tried to access Dashboard without a valid session!");
        res.redirect('/');
    }
});
app.get('/logo.jpg', async (req, res) => {
    res.sendFile(join(__dirname, 'static', 'logo.jpg'));
});
app.get('/hamburger.png', async (req, res) => {
    res.sendFile(join(__dirname, 'static', 'hamburger.png'));
});
/////////////////////////////////////
/////////    ETC end    /////////////
/////////////////////////////////////



// Start the server
server.listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
});

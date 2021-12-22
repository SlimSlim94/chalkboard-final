const connectionString = 'mongodb+srv://cs355:cs355@chalkboard.v5lmz.mongodb.net/chalkboard?retryWrites=true&w=majority';
// Express framework
const express = require('express');
// For parsing bodies of the requests
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
// Path operations
const path = require('path');

const session = require('express-session');
const MongoStore = require('connect-mongo');

const database = require('./database');

const { authRequired } = require('./auth');

// Creating the new express application
const app = express();

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Expose-Headers', '*')
  next();
})


app.use(session({
    secret: 'SUPER_SECRET_SESSION_KEY---@#!$%$21431243689908362d2d1-=;WZW',
    cookie: { maxAge: 365 * 24 * 60 * 60 * 1000 },
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: connectionString,
        ttl: 14 * 24 * 60 * 60 ,
        autoRemove: 'native' 
    })
}));

app.set('view engine', 'ejs');
// Making the public folder accessible for external use
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser());
// For parsing data sent from forms
app.use(bodyParser.json());
app.use(multer().array());
app.use(bodyParser.urlencoded({ extended: true }));


///////////////////////////// ROUTES
const studentRoutes = require('./routes/student');
const instructorRoutes = require('./routes/instructor');
const adminRoutes = require('./routes/admin');

app.use('/student', studentRoutes);
app.use('/instructor', instructorRoutes);
app.use('/admin', adminRoutes);


app.get('/', authRequired, (req, res) => {
	console.log(req.session);
	console.log("Role: ", req.session.user.role);
	if(['student', 'admin', 'instructor'].indexOf(req.session.user.role) != -1) {
		res.redirect(`${req.session.user.role}/dashboard`);
		return;
	}
	res.end("Unknown role");	
});

app.get('/login', (req, res) => {
	res.render('login');
});

app.get('/signup', (req, res) => {
	res.render('signup');
});

app.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/');
});
///////////////////////////

// API handlers
// Sign-up request
app.post('/api/signup', (req, res) => {
  const { body } = req;
  if (
    // Checking the request parameters for existence
    !body.username || !body.password || !body.confirmPassword
    || !body.firstName || !body.lastName || !body.role
    // Checking whether username, password, first name and last name are strings
    || typeof (body.username) !== 'string'
    || typeof (body.password) !== 'string'
    || typeof (body.confirmPassword) !== 'string'
    || typeof (body.firstName) !== 'string'
    || typeof (body.lastName) !== 'string'
  ) {
    res.status(422).json({ message: 'Invalid user information' });
  } else if (body.password !== body.confirmPassword) {
    res.status(422).json({ message: 'Passwords are different' });
  } else if (!body.username.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
    res.status(422).json({ message: 'Email is not valid' });
  } else {
    // Checking whether such user exists
    database.userExists(body.username, (isExists) => {
      if (isExists) {
        res.status(422).json({ message: 'Such user exists already' });
      } else {
        database.signUp(body);
        res.status(201).send();
      }
    });
  }
});

// Login request
app.post('/api/login', (req, res) => {

  const { body } = req;
  console.log('POST /api/login: ', req.body);
  // Checking the request parameters for existence
  if (!body.login || !body.password) {
    res.status(422).json({ message: 'Invalid credentials' });
  } else {
    // Checking whether such credentials are valid
    database.login(body, (user) => {
      if (!user) {
        res.status(404)
          .json({ message: 'No such user with the given credentials' });
      } else {
		  req.session.user = user;
		  req.session.save((err) => {
			  console.log(err);
			  console.log('login session: ', req.session);
			  res.status(200).json(user);
		  });
		  
		  
		  
	  }
    });
  }
});

// Admin search
// Login request
app.get('/api/admin/search', async (req, res) => {
  if(req.session.user.role != 'admin') return res.status(403);
  
  const result = await database.search(req.query);
  res.status(200).json(result);
});

// Instructors
// Get list of the instructors
app.get('/api/instructors', (req, res) => {
  if(req.session.user.role != 'instructor') return res.status(403);
  
  database.getUsers('instructor', (instructors) => {
    res.status(200).json(instructors);
  });
});

// Students
// Get list of the student
app.get('/api/students', (req, res) => {
  database.getUsers('student', (students) => {
    res.status(200).json(students);
  });
});



/////////////////////////////
// Courses
// Search course
app.get('/api/courses', async (req, res) => {  
  const course = await database.searchCourse(req.query);
  res.status(200).json(course);
});
// Create course
app.post('/api/courses', (req, res) => {
  if(req.session.user.role != 'instructor' && req.session.user.role != 'admin') return res.status(403);
  
  const { body } = req;
  if (!body.number || !body.name || !Array.isArray(body.instructors)
    || !body.instructors.length || !Array.isArray(body.students)
    || !body.students.length || !body.description
    || !Array.isArray(body.lessons) || !body.lessons.length
  ) {
    res.status(422).json({ message: 'Invalid course information' });
  } else {
    database.createCourse(body, () => {
      res.status(201).json(body);
    });
  }
});
// Update course
app.put('/api/courses/:id', async (req, res) => {
  if(req.session.user.role != 'instructor' && req.session.user.role != 'admin') return res.status(403);
  
  const course = req.body;
  await database.updateCourse(req.params.id, course);
  res.status(200).send();
});
// Delete course
app.delete('/api/courses/:id', async (req, res) => {
  if(req.session.user.role != 'instructor' && req.session.user.role != 'admin') return res.status(403);
  
  await database.deleteCourse(req.params.id);
  res.status(200).send();
});

// Starting listening on the port
const port = process.env.port || 80;
app.listen(port, () => {
  console.log(`Started listening for incoming connections at the port ${port}`);
});

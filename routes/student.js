const router = require('express').Router();
const database = require('../database');

const { authRequired } = require('../auth');

router.get('/dashboard', authRequired, async (req, res) => {
	console.log('GET [Student dashboard]');
	
	const { user } = req.session;
	
	// Allowable only for students
	if(user.role != 'student') return res.redirect('/');
	
	const params = {
		students: 'on',
		searchQuery: user.username,
	};
	let result = await database.search(params);

	if(result && result.length > 0 && result[0]) {
		result = result[0].enrolledCourses || [];
	}
	
	// TODO
	let assignments = [];
	
	res.render('student/dashboard', { 
		enrolled: result,
		assignments: assignments,
	});
});

router.get('/enrollment/:id?', authRequired, async (req, res) => {
	console.log('GET [Student enrollment], query: ', req.query, ', id: ', req.params);
	
	const { user } = req.session;
	const { id } = req.params;
	
	// Allowable only for students
	if(user.role != 'student') return res.redirect('/');
	
	let enrolled = [];
	let courses = [];
	
	
	let result = await database.search({ students: 'on', searchQuery: user.username });
	
	if(result && result.length > 0 && result[0]) {
		enrolled = result[0].enrolledCourses || [];
	}
	
	// Get list of all available courses
	const query = req.query.search || '';
	result = await database.search({ courses: 'on', searchQuery: query });
	// Remove already enrolled
	for(let course of result) {
		let c = enrolled.find( item => item._id.equals(course._id) );
		if(!c) {
			courses.push(course);
		}
	}
	
	
	// Course id specified
	if(id) {
		// ADD student to list
		database.courseEnroll(req.session.user._id, id);
		return res.redirect('/student/enrollment');
	}
	
	res.render('student/enrollment', { 
		enrolled: enrolled,
		courses: courses
	});
});

// Returns student enrolled course
router.get('/courses/:id', authRequired, async (req, res) => {
	const { user } = req.session;
	const { id } = req.params;
	// Allowable only for students
	if(user.role != 'student') return res.redirect('/');
	
	const course = await database.getCourse(id);
	
	res.render('student/course', {
		course: course
	});
});

// Returns student enrolled course
router.get('/submission/:id', authRequired, async (req, res) => {
	const { user } = req.session;
	const { id } = req.params;
	// Allowable only for students
	if(user.role != 'student') return res.redirect('/');
	
	// TODO: get lesson assignments and pass to view
	
	res.render('student/submission', {});
});

module.exports = router;
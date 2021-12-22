const router = require('express').Router();
const database = require('../database');

const { authRequired } = require('../auth');

router.get('/dashboard', authRequired, async (req, res) => {
	console.log('GET [Instructor dashboard]');
	
	const { user } = req.session;
	
	// Allowable only for instructors
	if(user.role != 'instructor') return res.redirect('/');
	
	let courses = await database.getRoster(user._id.toString());
	
	res.render('instructor/dashboard', { courses: courses, instructor: user });
});

router.get('/gradelesson', authRequired, async (req, res) => {
	console.log('GET [Instructor gradelesson]');
	
	const { user } = req.session;
	
	// Allowable only for instructors
	if(user.role != 'instructor') return res.redirect('/');
	

	res.render('instructor/gradelesson', {});
});


router.get('/roster', authRequired, async (req, res) => {
	console.log('GET [Instructor roseter]');
	
	const { user } = req.session;
	const { id } = req.params;
	
	// Allowable only for instructors
	if(user.role != 'instructor') return res.redirect('/');
	

	let courses = await database.getRoster(user._id.toString());
	res.render('instructor/roster', { courses: courses });
});

module.exports = router;
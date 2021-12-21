const router = require('express').Router();
const database = require('../database');

const { authRequired } = require('../auth');

router.get('/dashboard', authRequired, async (req, res) => {
	console.log('GET [Admin dashboard]');
	
	const { user } = req.session;
	
	// Allowable only for admins
	if(user.role != 'admin') return res.redirect('/');

	
	res.render('admin/dashboard', { });
});


module.exports = router;
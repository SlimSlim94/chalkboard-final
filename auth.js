const authRequired = (req, res, next) => {
	console.log('AUTH: ', req.session);
	if(!req.session.user) return res.redirect('/login');
	next();
};

module.exports = {
	authRequired
};
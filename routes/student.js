const router = require('express').Router();
const multer = require('multer');
const database = require('../database');

const { authRequired } = require('../auth');

var upload = multer({ dest: './public/uploads' });

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
	
	res.render('student/dashboard', { 
		enrolled: result
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
  const submissions = await database.getSubmissions(id, user._id);
  console.log("submissions: ", submissions);
	
	res.render('student/course', {
		course: course,
    submissions: submissions
	});
});

// Returns view for assignment submission
router.get('/submission/:courseId/:lessonId/:assignmentId', authRequired, async (req, res) => {
	const { user } = req.session;
	const { courseId, lessonId, assignmentId } = req.params;
	// Allowable only for students
	if(user.role != 'student') return res.redirect('/');
	
  const course = await database.getCourse(courseId);
  let assignment = null;
  let lesson = course.lessons.find(item => item._id.toString() == lessonId);
  if(lesson) {
    assignment = lesson.assignments.find(item => item._id.toString() == assignmentId);
  }
  
  if(assignment) {
    return res.render('student/submission', 
      { 
        course: course, assignment: assignment, 
        studentId: user._id,
        lessonId: lessonId,
      }
    );
  }
	
	res.redirect('/student/dashboard');
});

const type = upload.single('attachment');

router.post('/submission', authRequired, type, async (req, res) => {
	const { user } = req.session;
  // Allowable only for students
	if(user.role != 'student') return res.redirect('/');

  console.log('POST submission: ', req.body);
  console.log('attachnment: ', req.file);

  await database.addSubmission(
    user._id, 
    req.body.courseId, 
    req.body.lessonId,
    req.body.assignmentId,
    req.body.answer,
    req.file
  );
  
  res.redirect('/student/dashboard');
});

module.exports = router;
window.onload = (e) => {
	// Checking the current user
	if (!isStudent()) {
	  window.location.href = 'index.html';
	}

	const user = getCurrentUser();
	let studentCoursesList = document.getElementById('studentCourses');
	//studentCoursesList.innerHTML = "";
	
	// Get list of enrolled courses
	const XHR = new XMLHttpRequest();

	// Listener when request is completed
	XHR.addEventListener('load', (event) => {
		// If not HTTP Ok, then displaying status in the message
		if (event.target.status !== 200) {
		  //messageLabel.innerHTML = getErrorMessage(event.target);
		} else {
		  let courses = JSON.parse(event.target.response);
		  console.log("Courses: ", courses, typeof(courses));
		  
		  studentCoursesList.innerHTML = "";
		  
		  
		  const renderStudentList = (item, index, arr) => {
			  var link = document.createElement('a');
			  link.setAttribute('class', 'list-group-item list-group-item-action');
			  link.setAttribute('href', `/html/student_course.html?course=${item._id}`);
			  
			  studentCoursesList.appendChild(link);
			  link.innerHTML = item.number;
		  };
		  
		  courses.forEach(renderStudentList);
		  
		  for(let course of courses) {
			  console.log("Course: ", course);
		  }
		}
	});

	// Listener when request has failed
	XHR.addEventListener('error', () => {
		//messageLabel.innerHTML = 'Network error';
	});
    console.log(`${apiPath}/student/courses?username=${user.username}`);
	XHR.open('GET', `${apiPath}/student/courses?username=${user.username}`);
	XHR.send();
};
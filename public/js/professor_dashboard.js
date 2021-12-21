// Object, which will hold the data regarding to the course
let course;
// List of instructors
let instructors = [];
// List of students
let students = [];

/**
 * Prepares the page to create the course
 */
function newCourse() {
  course = {
    _id: null,
    creator: getCurrentUser()._id,
    number: '',
    name: '',
    instructors: [],
    students: [],
    description: '',
    lessons: [],
  };

  document.getElementById('courseNoInput').value = '';
  document.getElementById('courseNameInput').value = '';
  document.getElementById('courseDescriptionTextArea').value = '';

  updateInstructorsText();
  updateStudentsText();
  updateLessons();
}

/**
 * Searches for the course
 */
function searchCourse() {
  const XHR = new XMLHttpRequest();
  const messageLabel = document.getElementById('messageLabel');
  messageLabel.innerHTML = '';

  // Listener when request is completed
  XHR.addEventListener('load', (event) => {
    // If not HTTP Ok, then displaying status in the message
    if (event.target.status !== 200) { 
      messageLabel.innerHTML = getErrorMessage(event.target);
    } else {
      const result = JSON.parse(event.target.response);

      if (!result) messageLabel.innerHTML = "Not found";
      else {
        course = result;
        
        document.getElementById('courseNoInput').value = course.number;
        document.getElementById('courseNameInput').value = course.name;
        document.getElementById('courseDescriptionTextArea').value = course.description;

        // Setting up the instructors
        course.instructors = course.instructors.map((i) => {
          const instructor = instructors.find((i1) => i1._id === i._id);
          return { _id: instructor._id, text: `${instructor.firstName} ${instructor.lastName}` };
        });
        // Setting up the students
        course.students = course.students.map((s) => {
          const student = students.find((s1) => s1._id === s._id);
          return { _id: student._id, text: `${student.firstName} ${student.lastName}` };
        });      

        updateInstructorsText();
        updateStudentsText();
        updateLessons();
      }
    }
  });

  // Listener when request has failed
  XHR.addEventListener('error', () => {
    messageLabel.innerHTML = 'Network error';
  });

  const searchQuery = document.getElementById('courseSearch').value;
  XHR.open('GET', `${apiPath}/courses?searchQuery=${searchQuery}`);
  XHR.send();  
}

/**
 * Called when the course no is changed
 * @param {*} element Element with the course no
 */
function noChanged(element) {
  course.number = element.value;
}

/**
 * Called when the course name is changed
 * @param {*} element Element with the course name
 */
function nameChanged(element) {
  course.name = element.value;
}

/**
 * Retrieves the list of instructors from the server
 */
function getInstructors() {
  const XHR = new XMLHttpRequest();

  const messageLabel = document.getElementById('messageLabel');
  messageLabel.innerHTML = '';

  // Listener when request is completed
  XHR.addEventListener('load', (event) => {
    // If not HTTP Ok, then displaying status in the message
    if (event.target.status !== 200) {
      messageLabel.innerHTML = getErrorMessage(event.target);
    } else {
      // Adding instructors to the select
      const instructorsSelect = document.getElementById('instructorSelect');
      instructors = JSON.parse(event.target.response);
	  console.log(instructors);

      instructors.forEach((instructor) => {
        const option = document.createElement('option');
        option.value = instructor._id;
        option.innerHTML = `${instructor.firstName} ${instructor.lastName}`;

        instructorsSelect.appendChild(option);
      });
    }
  });

  // Listener when request has failed
  XHR.addEventListener('error', () => {
    messageLabel.innerHTML = 'Network error';
  });

  XHR.open('GET', `${apiPath}/instructors`);
  XHR.send();
}

/**
 * Updates the instructors text according to the added instructors to the course
 */
function updateInstructorsText() {
  let text = '';
  course.instructors
    .forEach((instructor, index) => {
      text += (index > 0 ? ', ' : '') + instructor.text;
    });

  const selectedInstructors = document.getElementById('selectedInstructors');
  selectedInstructors.innerHTML = text;
}

/**
 * Adds the selected instructor to the course
 */
function addInstructor() {
  // Retrieving the select element
  const instructorsSelect = document.getElementById('instructorSelect');
  // Retrieving the selected item's id and text
  const id = instructorsSelect.value;
  const { text } = instructorsSelect.options[instructorsSelect.selectedIndex];

  // Searching for the instructor
  if (!course.instructors.find((i) => i._id === id)) {
    // Adding the instructor
    course.instructors.push({ _id: id, text });
    updateInstructorsText();
  }
}

/**
 * Removes the selected instructor from the course
 */
function removeInstructor() {
  // Retrieving the select element
  const instructorsSelect = document.getElementById('instructorSelect');
  // Retrieving the selected item's id and text
  const id = instructorsSelect.value;

  // Removing the instructor
  course.instructors = course.instructors.filter((i) => i._id !== id);
  updateInstructorsText();
}

/**
 * Retrieves the list of students from the server
 */
 function getStudents() {
  const XHR = new XMLHttpRequest();

  const messageLabel = document.getElementById('messageLabel');
  messageLabel.innerHTML = '';

  // Listener when request is completed
  XHR.addEventListener('load', (event) => {
    // If not HTTP Ok, then displaying status in the message
    if (event.target.status !== 200) {
      messageLabel.innerHTML = getErrorMessage(event.target);
    } else {
      // Adding students to the select
      const studentsSelect = document.getElementById('studentSelect');
      students = JSON.parse(event.target.response);

      students.forEach((student) => {
        const option = document.createElement('option');
        option.value = student._id;
        option.innerHTML = `${student.firstName} ${student.lastName}`;

        studentsSelect.appendChild(option);
      });
    }
  });

  // Listener when request has failed
  XHR.addEventListener('error', () => {
    messageLabel.innerHTML = 'Network error';
  });

  XHR.open('GET', `${apiPath}/students`);
  XHR.send();
}

/**
 * Updates the students text according to the added students to the course
 */
function updateStudentsText() {
  let text = '';
  course.students
    .forEach((student, index) => {
      text += (index > 0 ? ', ' : '') + student.text;
    });

  const selectedStudents = document.getElementById('selectedStudents');
  selectedStudents.innerHTML = text;
}

/**
 * Adds the selected student to the course
 */
function addStudent() {
  // Retrieving the select element
  const studentsSelect = document.getElementById('studentSelect');
  // Retrieving the selected item's id and text
  const id = studentsSelect.value;
  const { text } = studentsSelect.options[studentsSelect.selectedIndex];

  // Searching for the student
  if (!course.students.find((i) => i._id === id)) {
    // Adding the student
    course.students.push({ _id: id, text });
    updateStudentsText();
  }
}

/**
 * Removes the selected student from the course
 */
function removeStudent() {
  // Retrieving the select element
  const studentsSelect = document.getElementById('studentSelect');
  // Retrieving the selected item's id and text
  const id = studentsSelect.value;

  // Removing the student
  course.students = course.students.filter((i) => i._id !== id);
  updateStudentsText();
}

/**
 * Called when the course description is changed
 * @param {*} element Element with the course description
 */
function descriptionChanged(element) {
  course.description = element.value;
}

/**
 * Updates the lessons on the page according to the current list of lessons
 */
function updateLessons() {
  // Retrieving the lessons table
  const lessonsTableBody = document.getElementById('lessonsTableBody');
  // Removing all elements except first line
  lessonsTableBody.innerHTML = '';
  // Adding the lessons
  course.lessons.forEach((_lesson, index) => {
    const lessonText = document.createElement('td');
    lessonText.innerHTML = `Lesson #${index + 1}`;
    const lessonControl = document.createElement('td');
    lessonControl.className = 'lessonControlButton';
    lessonControl
      .innerHTML = `<a href="#" onclick="removeLesson(${index})">(-)</a>`;

    const lessonRow = document.createElement('tr');
    lessonRow.append(lessonText, lessonControl);

    lessonsTableBody.appendChild(lessonRow);
  });

  // Add lesson
  const addLessonText = document.createElement('td');
  addLessonText.innerHTML = 'Add more...';
  const addLessonControl = document.createElement('td');
  addLessonControl.className = 'lessonControlButton';
  addLessonControl.innerHTML = '<a href="#" onclick="addLesson()">(+)</a>';

  const addLessonRow = document.createElement('tr');
  addLessonRow.append(addLessonText, addLessonControl);

  lessonsTableBody.appendChild(addLessonRow);
}

/**
 * Adds new lesson
 */
function addLesson() {
  // Adding the lesson
  course.lessons.push({});
  // Updating the lessons on the page
  updateLessons();
}

/**
 * Removes lesson with the given index
 */
function removeLesson(index) {
  // Removing the lesson
  course.lessons = course.lessons.filter((_lesson, i) => i !== index);
  // Updating the lessons on the page
  updateLessons();
}

/**
 * Creates the new course at server
 */
function createCourse() {
  // Request to create the course
  const XHR = new XMLHttpRequest();

  const messageLabel = document.getElementById('messageLabel');
  messageLabel.innerHTML = '';

  // Listener when request is completed
  XHR.addEventListener('load', (event) => {
    // If not HTTP Created, then displaying status in the message
    if (event.target.status !== 201) {
      messageLabel.innerHTML = getErrorMessage(event.target);
    } else {
      course = JSON.parse(event.target.response);

      messageLabel.innerHTML = 'Course is created';
    }
  });

  // Listener when request has failed
  XHR.addEventListener('error', () => {
    messageLabel.innerHTML = 'Network error';
  });

  XHR.open('POST', `${apiPath}/courses`);
  XHR.setRequestHeader('Content-type', 'application/json');
  // Serializing the course object to string
  const data = JSON.stringify(course, (key, value) => {
    let result;
    // Leaving only id's for the instructors and students
    if (key === 'instructors' || key === 'students') {
      result = value.map((i) => ({ _id: i._id }));
    } else result = value;
    return result;
  });
  XHR.send(data);
}

/**
 * Updates the current course on the server
 */
function updateCourse() {
  // Request to update the course
  const XHR = new XMLHttpRequest();

  const messageLabel = document.getElementById('messageLabel');
  messageLabel.innerHTML = '';

  // Listener when request is completed
  XHR.addEventListener('load', (event) => {
    // If not HTTP OK, then displaying status in the message
    if (event.target.status !== 200) {
      messageLabel.innerHTML = getErrorMessage(event.target);
    } else {
      messageLabel.innerHTML = 'Course is updated';
    }
  });

  // Listener when request has failed
  XHR.addEventListener('error', () => {
    messageLabel.innerHTML = 'Network error';
  });

  XHR.open('PUT', `${apiPath}/courses/${course._id}`);
  XHR.setRequestHeader('Content-type', 'application/json');

  // Preparing the object to send
  const objectToSend = JSON.parse(JSON.stringify(course));
  // Removing _id
  delete objectToSend._id;
  // Leaving only id's for the instructors and students  
  objectToSend.instructors = objectToSend.instructors
    .map((i) => ({ _id: i._id }));
  objectToSend.students = objectToSend.students
    .map((i) => ({ _id: i._id }));    
  // Serializing the course object to string
  XHR.send(JSON.stringify(objectToSend));
}

/**
 * Saves the current course
 */
function saveCourse() {
  // Checking whether this is a new course
  if (!course._id) createCourse();
  else updateCourse();
}

/**
 * Deletes the currently opened course
 */
function deleteCourse() {
  // Request to update the course
  const XHR = new XMLHttpRequest();

  const messageLabel = document.getElementById('messageLabel');
  messageLabel.innerHTML = '';

  // Listener when request is completed
  XHR.addEventListener('load', (event) => {
    // If not HTTP OK, then displaying status in the message
    if (event.target.status !== 200) {
      messageLabel.innerHTML = getErrorMessage(event.target);
    } else {
      course._id = null;
      messageLabel.innerHTML = 'Course is deleted';
    }
  });

  // Listener when request has failed
  XHR.addEventListener('error', () => {
    messageLabel.innerHTML = 'Network error';
  });

  XHR.open('DELETE', `${apiPath}/courses/${course._id}`);
  XHR.send();
}

// Checking the current user
if (!isProfessor()) {
  window.location.href = 'index.html';
}
window.addEventListener('load', () => {
  // Setting the page for the new course
  newCourse();

  // Retrieving the list of the instructors and students
  getInstructors();
  getStudents();
});
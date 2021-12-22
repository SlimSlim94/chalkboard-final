/**
 * Retrieves the prepared search results: removes the search result's children.
 * @param {*} name The name of the search results
 * @returns Object with elements for table and it's body
 */
function getPreparedSearchResults(name) {
  // Retrieving the element
  const table = document.getElementById(name);
  const body = document.getElementById(`${name}Body`);

  // Clearing the body
  while (body.firstChild) body.removeChild(body.firstChild);

  // Hiding the results
  table.hidden = true;

  return { table, body };
}

/**
 * Searches for the data
 */
function search() {
  // Request for the signup
  const XHR = new XMLHttpRequest();
  // Form data to send
  const FD = new FormData(document.getElementById('searchForm'));

  // Clearing the search messages
  const searchMessages = document.getElementById('searchMessages');
  searchMessages.innerHTML = '';
  // Retrieving the prepared search results
  const students = getPreparedSearchResults('searchStudentsResults');
  const instructors = getPreparedSearchResults('searchInstructorsResults');
  const courses = getPreparedSearchResults('searchCoursesResults');

  // Listener when request is completed
  XHR.addEventListener('load', (event) => {
    // If not HTTP Created, then displaying status in the message
    if (event.target.status !== 200) {
      searchStudentsResults.innerHTML = getErrorMessage(event.target);
    } else {
      const result = JSON.parse(event.target.response);
      result.forEach((item) => {
        // Creating the new list item
        const row = document.createElement('tr');
        // Checking whether the item is the user object
        if (item.role) {
          const firstNameTD = document.createElement('td');
          firstNameTD.innerHTML = item.firstName;
          const lastNameTD = document.createElement('td');
          lastNameTD.innerHTML = item.lastName;
          const emailTD = document.createElement('td');
          emailTD.innerHTML = item.username;
          const passwordTD = document.createElement('td');
          passwordTD.innerHTML = item.password;
          const roleTD = document.createElement('td');
          roleTD.innerHTML = item.role;
          // Enrolled courses
          let enrolledCourses = '';
          item.enrolledCourses.forEach((course, index) => {
            enrolledCourses += (index > 0 ? ', ' : '') + course.number;
          });
          const enrolledCoursesTD = document.createElement('td');
          enrolledCoursesTD.innerHTML = enrolledCourses;

          row.append(
            firstNameTD,
            lastNameTD,
            emailTD,
            passwordTD,
            roleTD,
            enrolledCoursesTD,
          );
          if (item.role === 'teacher') {
            // Preparing courses information
            let createdCourses = '';
            item.createdCourses.forEach((course, index) => {
              createdCourses += (index > 0 ? ', ' : '') + course.number;
            });
            const createdCoursesTD = document.createElement('td');
            createdCoursesTD.innerHTML = createdCourses;
            row.appendChild(createdCoursesTD);

            instructors.body.appendChild(row);
            instructors.table.hidden = false;
          } else {
            students.body.appendChild(row);
            students.table.hidden = false;
          }
        } else {
          // Course information
          // Preparing table columns
          const creatorTD = document.createElement('td');
          creatorTD
            .innerHTML = `${item.creator.firstName} ${item.creator.lastName}`;
          const numberTD = document.createElement('td');
          numberTD.innerHTML = item.number;
          const nameTD = document.createElement('td');
          nameTD.innerHTML = item.name;

          let courseInstructors = '';
          item.instructors.forEach((instructor, index) => {
            courseInstructors += index > 0 ? ', ' : '';
            courseInstructors
              += `${instructor.firstName} ${instructor.lastName}`;
          });
          const instructorsTD = document.createElement('td');
          instructorsTD.innerHTML = courseInstructors;

          let courseStudents = '';
          item.students.forEach((student, index) => {
            courseStudents += index > 0 ? ', ' : '';
            courseStudents
              += `${student.firstName} ${student.lastName}`;
          });
          const studentsTD = document.createElement('td');
          studentsTD.innerHTML = courseStudents;

          const descriptionTD = document.createElement('td');
          descriptionTD.innerHTML = item.description;

          let courseLessons = '';
          item.lessons.forEach((lesson, index) => {
            courseLessons += index > 0 ? ', ' : '';
            courseLessons += (index + 1);
          });
          const lessonsTD = document.createElement('td');
          lessonsTD.innerHTML = courseLessons;

          row.append(
            creatorTD,
            numberTD,
            nameTD,
            instructorsTD,
            studentsTD,
            descriptionTD,
            lessonsTD,
          );
          courses.body.appendChild(row);
          courses.table.hidden = false;
        }
      });
    }
  });

  // Listener when request has failed
  XHR.addEventListener('error', () => {
    searchMessages.innerHTML = 'Network error';
  });

  XHR
    .open(
      'GET',
      `${apiPath}/admin/search?${new URLSearchParams(FD).toString()}`,
    );
  XHR.send(FD);

  return false;
}

// Searching on the start
search();
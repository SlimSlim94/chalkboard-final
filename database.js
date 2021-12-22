const { MongoClient, ObjectId, Timestamp } = require('mongodb');

const connectionString = 'mongodb+srv://cs355:cs355@chalkboard.v5lmz.mongodb.net/chalkboard?retryWrites=true&w=majority';

// Connects to the Chalkboard database
function connect(onConnect) {
  const mongoClient = new MongoClient(connectionString);
  mongoClient.connect((err, client) => {
    if (err) {
      console.log(err);
      return;
    }
    // Retrieving the database object
    const db = client.db('chalkboard');
    // Calling handler on connection
    onConnect(db, () => {
      // Closing the connection
      client.close();
    });
  });
}

/**
 * Async version of connect
 */
async function connectAsync() {
  const client = await new MongoClient(connectionString).connect()
    .catch((err) => console.log(err));

  if (client) {
    // Retrieving the database object
    return { client, db: client.db('chalkboard') };
  }
}

exports.getSubmissions = async (courseId, userId) => {
  const { client, db } = await connectAsync();
  const submissions = db.collection('submissions');
  const result = await submissions.find({ course: courseId, user: userId }).toArray();
  return result;
};

exports.addSubmission = async(
  userId, courseId, lessonId, assignmentId, answer, file
) => {
  const { client, db } = await connectAsync();
  const submissions = db.collection('submissions');

  await submissions.insertOne({ 
    user: userId, 
    course: courseId, 
    lesson: lessonId, 
    assignment: assignmentId,
    answer: answer,
    file: file,
    ts: new Timestamp(),
    grade: null
  });
};

exports.courseEnroll = async (userId, courseId) => {
  const { client, db } = await connectAsync();
  let course = await db.collection('courses').updateOne(
	{ _id: new ObjectId(courseId) },
	{ $push: {students: { _id: userId.toString() } }}
	);
};
// Checks whether user exists with the given username
// Calls back the onResult function with the result of search
exports.userExists = (username, onResult) => {
  connect((db, onFinish) => {
    const users = db.collection('users');
    users.count({ username })
      .then((count) => {
        onResult(count > 0);
        onFinish();
      });
  });
};

// Sign-ups the user with the given data
exports.signUp = (user) => {
  connect((db, onFinish) => {
    const users = db.collection('users');
	delete user.confirmPassword;
	console.log("signUp: ", user);
    // Inserting new user record
    users.insertOne(user, (err) => {
      if (err) console.log(err);

      onFinish();
    });
  });
};

// Checks whether such credentials are valid
exports.login = (credentials, onFind) => {
  connect((db, onFinish) => {
    const users = db.collection('users');

    users
      .find(
        { username: credentials.login, password: credentials.password },
      )
      .next()
      .then((user) => {
        onFind(user);
        onFinish();
      });
  });
};

// Returns the list of the users for the given role
exports.getUsers = (role, onFind) => {
  connect((db, onFinish) => {
    const usersCollection = db.collection('users');

    // Selecting only id's, first names and last names
    usersCollection
      .find({ role })
      .project({ firstName: 1, lastName: 1 })
      .toArray()
      .then((users) => {
        onFind(users);
        onFinish();
      });
  });
};

/**
 * Returns the list of the courses in which the given user is enrolled
 * @param {*} user The user for which the enrollment is searched for
 * @returns Array of the courses
 */
async function getEnrolledCourses(user) {
  const { client, db } = await connectAsync();

  const courses = db.collection('courses');

  const result = user.role === 'student'
    ? await courses.find({ students: { _id: user._id.toString() } }).toArray()
    : await courses
      .find({ instructors: { _id: user._id.toString() } }).toArray();

  client.close();
  return result;
}

/**
 * Returns the list of the courses, created by the instructor with the given id
 * @param {*} id
 * @returns Array with the courses
 */
async function getCreatedCourses(id) {
  const { client, db } = await connectAsync();

  const courses = db.collection('courses');

  const result = await courses.find({ creator: id }).toArray();
  client.close();

  return result;
}

/**
 * Retrieves the user with the given id
 * @param {*} id
 * @returns Object with the user information
 */
async function getUser(id) {
  const { client, db } = await connectAsync();

  const user = await db.collection('users').find({ _id: new ObjectId(id) })
    .next();

  client.close();
  return user;
}

/**
 * Returns detailed user information about the users
 * @param {*} users Array of users represented by the objects with id
 * @returns Array of detailed users information represented by the objects
 */
async function getUsersDetails(users) {
  const requests = users.map(async (user) => getUser(user._id));
  const result = await Promise.all(requests);

  return result;
}

exports.getRoster = async (instructorId) => {
  const { client, db } = await connectAsync();
  const result = await db.collection('courses').find({}).toArray();
  
  let courses = [];
  for(let r of result) {
	let res = r.instructors.find(item => item._id == instructorId);
	if(res) {
		courses.push(await getCourse(r._id))  ;
	}
  }	  
  
  client.close();
  return courses;
};
// Searches the database with the given search query
exports.search = async (query) => {
  const { client, db } = await connectAsync();

  // Users
  let usersPromise = null;
  // Preparing roles
  const roles = [];
  if (query.students === 'on') roles.push({ role: 'student' });
  if (query.instructors === 'on') roles.push({ role: 'instructor' });

  if (roles.length) {
    const collection = db.collection('users');

    const dbQuery = { username: { $regex: query.searchQuery } };
    dbQuery.$or = roles;

    usersPromise = collection.find(dbQuery).toArray();
  }

  // Courses
  let coursesPromise = null;
  if (query.courses === 'on') {
    const collection = db.collection('courses');

    // Searching for the courses with the similar number or name
    coursesPromise = collection
      .find({
        $or: [
          { number: { $regex: query.searchQuery } },
          { name: { $regex: query.searchQuery } },
        ],
      })
      .toArray();
  }

  // Running all requests and searching the users and courses
  const values = await Promise.all([usersPromise, coursesPromise]);
  let result = [];
  values.forEach((v) => {
    // Only appending non-empty results
    if (v) result = result.concat(v);
  });

  // Preparing the detailed requests
  let detailedRequests = [];
  // The enrolled courses to for the students and instructors
  detailedRequests = detailedRequests.concat(result
    .filter((item) => item.role)
    .map(async (user) => getEnrolledCourses(user)
      .then((courses) => {
        const u = user;
        u.enrolledCourses = courses;
      })));
  // The created courses for the instructors
  detailedRequests = detailedRequests.concat(result
    .filter((item) => item.role && item.role === 'teacher')
    .map(async (item) => getCreatedCourses(item._id.toString())
      .then((courses) => {
        const i = item;
        i.createdCourses = courses;
      })));
  // Courses
  detailedRequests = detailedRequests.concat(result
    .filter((item) => !item.role)
    .map((course) => [
      // Adding the creator information about the course
      getUser(course.creator).then((creator) => {
        const c = course;
        c.creator = creator;
      }),
      // Information about the instructors
      getUsersDetails(course.instructors).then((instructors) => {
        const c = course;
        c.instructors = instructors;
      }),
      // Information about the students
      getUsersDetails(course.students).then((students) => {
        const c = course;
        c.students = students;
      }),
    ]));

  // Executing all detailed requests
  detailedRequests = detailedRequests.flat();
  await Promise.all(detailedRequests);

  client.close();
  return result;
};

/**
 *  Searches for the course according to the given query
 */
exports.searchCourse = async (query) => {
  const { client, db } = await connectAsync();

  const result = await db.collection('courses').find({ 
    $or: [
      { number: { $regex: query.searchQuery }},
      { name : { $regex: query.searchQuery }},
    ]}).next();

  client.close();
  return result;
};
exports.getCourse = getCourse;
// Get course by id
async function getCourse(id) {
  const { client, db } = await connectAsync();

  let course = await db.collection('courses').find({ _id: new ObjectId(id) })
	.next();
	
  if(course) {
	  let students = [];
	  for(let student of course.students) {
		let user = await db.collection('users').find({ _id: new ObjectId(student._id) })
			.next();
		delete user.password;
		students.push(user);
	  }
	  course.students = students;
	  
	  let instructors = [];
	  for(let instructor of course.instructors) {
		let user = await db.collection('users').find({ _id: new ObjectId(instructor._id) })
			.next();
		delete user.password;
		instructors.push(user);
	  }
	  course.instructors = instructors;
  }
	
  client.close();
  return course;
};
// Creates the new course
exports.createCourse = (course, onCreated) => {
  connect((db, onFinish) => {
    const courses = db.collection('courses');
    
    for(let lesson of course.lessons) {
      lesson._id = new ObjectId();
      for(let assignment of lesson.assignments) {
        assignment._id = new ObjectId();
      }
    }


    // Inserting new user record
    courses.insertOne(course, (err) => {
      if (err) console.log(err);

      onCreated();
      onFinish();
    });
  });
};
// Updates the existing course
exports.updateCourse = async (id, course) => {
  const { client, db } = await connectAsync();

  await db.collection('courses').updateOne({ _id: new ObjectId(id) }, { $set: course});
  client.close();
};
// Deletes the course with the given id
exports.deleteCourse = async (id) => {
  const { client, db } = await connectAsync();

  await db.collection('courses').deleteOne({ _id: new ObjectId(id) });
  client.close();
};
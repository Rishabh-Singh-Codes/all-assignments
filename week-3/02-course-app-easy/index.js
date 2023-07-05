const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  let {username, password} = req.body;
  if(ADMINS.findIndex((admin) => admin.username === username) < 0) {
    ADMINS.push({username, password});
    res.status(201).json({message: 'Admin created successfully' });
  } else {
    res.status(400).send('Username already exists.');
  }
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  let {username, password} = req.headers;
  if(ADMINS.findIndex((admin) => admin.username == username && admin.password == password) > -1) {
    res.status(200).json({ message: 'Logged in successfully' });
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.post('/admin/courses', (req, res) => {
  // logic to create a course
  let {username, password} = req.headers;
  if(ADMINS.findIndex((admin) => admin.username == username && admin.password == password) > -1) {
    let { title, description, price, imageLink, published } = req.body;
    let randId = uuidv4();
    COURSES.push({courseId: randId, title, description, price, imageLink, published});

    res.status(200).json({ message: 'Course created successfully', courseId: randId })
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.put('/admin/courses/:courseId', (req, res) => {
  // logic to edit a course
  let {username, password} = req.headers;
  if(ADMINS.findIndex((admin) => admin.username == username && admin.password == password) > -1) {
    let courseId = req.params.courseId;
    let courseIndex = COURSES.findIndex(course => course.courseId === courseId);

    if(courseIndex > -1) {
      let { title, description, price, imageLink, published } = req.body;

      COURSES[courseIndex] = {courseId, title, description, price, imageLink, published};

      res.status(200).json({ message: 'Course updated successfully'})

    } else {
      res.status(404).json({message: 'Course not found'});
    }

  } else {
    res.status(401).send('Unauthorized');
  }
});

app.get('/admin/courses', (req, res) => {
  // logic to get all courses
  let {username, password} = req.headers;
  if(ADMINS.findIndex((admin) => admin.username == username && admin.password == password) > -1) {
    res.status(200).json({courses: COURSES})

  } else {
    res.status(401).send('Unauthorized');
  }
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  let {username, password} = req.body;
  if(USERS.findIndex((user) => user.username === username) < 0) {
    USERS.push({username, password});
    res.status(201).json({message: 'User created successfully' });
  } else {
    res.status(400).send('Username already exists.');
  }
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  let {username, password} = req.headers;
  if(USERS.findIndex((user) => user.username == username && user.password == password) > -1) {
    res.status(200).json({ message: 'Logged in successfully' });
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
  let {username, password} = req.headers;
  if(USERS.findIndex((user) => user.username == username && user.password == password) > -1) {
    res.status(200).json({ courses: COURSES });
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.post('/users/courses/:courseId', (req, res) => {
  // logic to purchase a course
  let {username, password} = req.headers;
  let userIndex = USERS.findIndex((user) => user.username == username && user.password == password)
  if(userIndex > -1) {
    let courseId = req.params.courseId;
    let courseIndex = COURSES.findIndex(course => course.courseId === courseId);

    if(courseIndex > -1) {

      if(USERS[userIndex].purchasedCourses) {
        if(USERS[userIndex].purchasedCourses.findIndex(course => course.courseId === courseId) > -1) {
          return res.status(201).json({ message: 'Course already purchased'});
        } else {
          USERS[userIndex].purchasedCourses.push(COURSES[courseIndex]);
        }
      } else {
        USERS[userIndex].purchasedCourses = [COURSES[courseIndex]];
      }

      res.status(200).json({ message: 'Course purchased successfully'});

    } else {
      res.status(404).json({message: 'Course not found'});
    }
  } else {
    res.status(401).send('Unauthorized');
  }
});

app.get('/users/purchasedCourses', (req, res) => {
  // logic to view purchased courses
  let {username, password} = req.headers;
  let userIndex = USERS.findIndex((user) => user.username == username && user.password == password)
  if(userIndex > -1) {
    res.status(200).json({ purchasedCourses: USERS[userIndex].purchasedCourses});
  } else {
    res.status(403).send('Unauthorized');
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

module.exports = app;
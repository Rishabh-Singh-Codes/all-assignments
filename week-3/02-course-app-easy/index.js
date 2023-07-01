const express = require('express');
const app = express();

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
});

app.put('/admin/courses/:courseId', (req, res) => {
  // logic to edit a course
});

app.get('/admin/courses', (req, res) => {
  // logic to get all courses
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
});

app.post('/users/login', (req, res) => {
  // logic to log in user
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
});

app.post('/users/courses/:courseId', (req, res) => {
  // logic to purchase a course
});

app.get('/users/purchasedCourses', (req, res) => {
  // logic to view purchased courses
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

module.exports = app;
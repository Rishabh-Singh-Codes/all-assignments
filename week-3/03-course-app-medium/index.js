const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());

const readFile = (filename) => {
  let data = fs.readFileSync(filename, "utf-8");
  if(data.length) return JSON.parse(data);
  else return [];
}

const writeFile = (filename, data) => {
  fs.writeFileSync(filename, JSON.stringify(data), "utf-8");
}

let ADMINS = readFile('./ADMINS.json');
let USERS = readFile('./USERS.json');
let COURSES = readFile('./COURSES.json');

const adminSecret = "Th1sisAdm1nSecr3t";
const userSecret = "Th1sisUs3rSecr3t";

const createAdminJWT = (admin) => {
  let payload = {username: admin}
  let token = jwt.sign(payload, adminSecret, {expiresIn: '1h'});

  return token;
}

const createUserJWT = (user) => {
  let payload = {username: user}
  let token = jwt.sign(payload, userSecret, {expiresIn: '1h'});

  return token;
}

const adminAuth = (req, res, next) => {
  let authHeader = req.headers.authorization;
  
  if(authHeader !== undefined) {
    let token = authHeader.split(" ")[1];

    try {
      jwt.verify(token, adminSecret, (err, response) => {
        if(err) {
          return res.status(403).json({message: 'Auth error: token not verified.'});
        }

        let admin = ADMINS.find(admin => admin.username === response.username);

        if(admin) {
          req.admin = response;
          return next();
        } 

        return res.status(403).json({message: 'Auth error: Admin does not exist.'});

      });
    } catch {
      return res.status(401).json({message: 'Auth error: Token missing.'});
    }
    
  } else {
    return res.status(401).json({message: 'Auth error: Headers missing.'});
  }
}

const userAuth = (req, res, next) => {
  let authHeader = req.headers.authorization;
  
  if(authHeader !== undefined) {
    let token = authHeader.split(" ")[1];

    try {
      jwt.verify(token, userSecret, (err, response) => {
        if(err) {
          return res.status(403).json({message: 'Auth error: token not verified.'});
        }

        let user = USERS.find(user => user.username === response.username);

        if(user) {
          req.user = response;
          return next();
        } 

        return res.status(403).json({message: 'Auth error: User does not exist.'});

      });
    } catch {
      return res.status(401).json({message: 'Auth error: Token missing.'});
    }
    
  } else {
    return res.status(401).json({message: 'Auth error: Headers missing.'});
  }
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  let  { username, password } = req.body;
  let admin = ADMINS.find(admin => admin.username === username && admin.password === password);

  if(admin) {
    return res.status(403).json({message: 'Admin already exists.'});
  } else {
    ADMINS.push({ username, password });
    let adminToken = createAdminJWT(username);
    writeFile('./ADMINS.json', ADMINS);
    return res.status(200).json({ message: 'Admin created successfully', token: adminToken });
  }
});

app.post('/admin/login', (req, res) => {
  let  { username, password } = req.headers;
  let admin = ADMINS.find(admin => admin.username === username && admin.password === password);

  if(admin) {
    let adminToken = createAdminJWT(username);
    res.status(200).json({ message: 'Logged in successfully.', token: adminToken });
  } else {
    res.status(403).json({message: 'Admin authentication failed.'});
  }
});

app.post('/admin/courses', adminAuth, (req, res) => {
  const course = req.body;
  course.id = COURSES.length + 1;
  COURSES.push(course);
  writeFile('./COURSES.json', COURSES);
  res.status(200).json({ message: 'Course created successfully', courseId: course.id });
});

app.put('/admin/courses/:courseId', adminAuth, (req, res) => {
  const updatedCoursedata = req.body;

  const courseId = req.params.courseId;

  const courseIndex = COURSES.findIndex(course => course.id === Number(courseId));

  if(courseIndex > -1) {
    COURSES[courseIndex] = {...COURSES[courseIndex], ...updatedCoursedata};
    writeFile('./COURSES.json', COURSES);
    res.status(200).json({ message: 'Course updated successfully.' });
  } else {
    res.status(404).json({message: 'Course not found.'});
  }
});

app.get('/admin/courses', adminAuth, (req, res) => {
  res.status(200).json({courses: COURSES});
});

// User routes
app.post('/users/signup', (req, res) => {
  let {username, password} = req.body;

  let user = USERS.find(user => user.username === username && user.password === password);

  if(user) {
    return res.status(403).json({message: 'User already exists.'});
  } else {
    USERS.push({ username, password });
    let userToken = createUserJWT(username);
    writeFile('./USERS.json', USERS);
    return res.status(200).json({ message: 'User created successfully', token: userToken });
  }
});

app.post('/users/login', (req, res) => {
  let  { username, password } = req.headers;
  let user = USERS.find(user => user.username === username && user.password === password);

  if(user) {
    let userToken = createUserJWT(username);
    return res.status(200).json({ message: 'Logged in successfully.', token: userToken });
  } else {
    return res.status(403).json({message: 'User authentication failed.'});
  }
});

app.get('/users/courses', userAuth, (req, res) => {
  return res.status(200).json({courses: COURSES});
});

app.post('/users/courses/:courseId', userAuth, (req, res) => {
  const courseId = Number(req.params.courseId);

  let course = COURSES.find(course => course.id === courseId);

  if(course) {
    let username = req.user.username;

    let user = USERS.find(user => user.username === username);
    if(user.purchasedCourses) {
      user.purchasedCourses.push(course);
    } else {
      user.purchasedCourses = [];
      user.purchasedCourses.push(course);
    }
    writeFile('./USERS.json', USERS);
    return res.status(200).json({message: 'Course added successfully', user});
  } else {
    return res.status(404).json({message: 'Course does not exist.'});
  }

});

app.get('/users/purchasedCourses', userAuth, (req, res) => {
  let user = USERS.find(user => user.username === req.user.username);
  if(user.purchasedCourses) {
    return res.status(200).json({purchasedCourses: user.purchasedCourses});
  } else {
    return res.status(200).json({purchasedCourses: []});
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

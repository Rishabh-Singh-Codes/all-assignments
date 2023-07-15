const express = require('express');
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

//mongoose schema
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  price: Number,
  imageLink: {
    type: String,
    default: "",
  },
  published: {
    type: Boolean,
    default: true,
  }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  purchasedCourses: [{type: mongoose.Schema.Types.ObjectId, ref: "Course"}]
});

//mongoose models
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);
const User = mongoose.model('User', userSchema);

const adminSecret = 'A0m1nS3cr3t';
const userSecret = 'uS3rS3cr3t';

const createAdminJWT = (admin) => {
  const token = jwt.sign(admin, adminSecret, {expiresIn: '1h'});

  return token;
}

const createUserJWT = (user) => {
  const token = jwt.sign(user, userSecret, {expiresIn: '1h'});
  return token;
}

const adminAuth = (req, res, next) => {
  let authHeader = req.headers.authorization; 

  if(authHeader) {
    const token = authHeader.split(" ")[1];

    try {
      jwt.verify(token, adminSecret, (err, response) => {
        if(err) {
          return res.status(401).json({message: 'Auth Error: Token not verified.'});
        }

        req.admin = response;
        next();
      })
    } catch {
      return res.status(401).json({message: 'Auth Error: Token missing.'});
    }
  } else {
    return res.status(401).json({message: 'Auth Error: Headers missing.'});
  }
}

const userAuth = (req, res, next) => {
  let authHeader = req.headers.authorization; 

  if(authHeader) {
    const token = authHeader.split(" ")[1];

    try {
      jwt.verify(token, userSecret, (err, response) => {
        if(err) {
          return res.status(401).json({message: 'Auth Error: Token not verified.'});
        }
        req.user = response;
        next();
      })
    } catch {
      return res.status(401).json({message: 'Auth Error: Token missing.'});
    }
  } else {
    return res.status(401).json({message: 'Auth Error: Headers missing.'});
  }
}
 
// Admin routes
app.post('/admin/signup', async (req, res) => {
  const {username, password} = req.body;

  const admin = await Admin.findOne({username});

  if(admin) {
    return res.status(403).json({message: 'Username already exists.'});
  } else {
    const token = createAdminJWT({username, role: "admin"});
    const newAdmin = new Admin({username, password});
    await newAdmin.save();

    return res.status(200).json({message: "Admin created successfully", token});
  }
});

app.post('/admin/login', async (req, res) => {
  const {username, password} = req.headers;

  const admin = await Admin.findOne({username, password});
  if(admin) {
    const token = createAdminJWT({username, role: "admin"});
    return res.status(200).json({message: "Logged in successfully", token});
  } else {
    return res.status(403).json({message: "Invalid username or password"});
  }
});

app.post('/admin/courses', adminAuth, async (req, res) => {
  const courseData = req.body;
  const newCourse = new Course(courseData);
  await newCourse.save();

  return res.status(200).json({message: "Course added successfully", courseId: newCourse.id});
});

app.put('/admin/courses/:courseId', adminAuth, async (req, res) => {
  const courseId = req.params.courseId;
  const updatedCourseData = req.body;

  try{
    await Course.findByIdAndUpdate(courseId, updatedCourseData, {new: true});
    return res.status(200).json({message: "Course updated successfully"});
  } catch (error) {
    return res.status(404).json({message: "Course not found", error});
  }
});

app.get('/admin/courses', adminAuth, async (req, res) => {
  const courses = await Course.find({});

  return res.status(200).json({courses});
});

// User routes
app.post('/users/signup', async (req, res) => {
  const {username, password} = req.body;
  const user = await User.findOne({username});

  if(user) {
    return res.status(403).json({message: "username already exists"});
  } else {
    const token = createUserJWT({username, role: "user"});
    const newUser = new User({username, password});
    await newUser.save();

    return res.status(200).json({message: "User created successfully", token});
  }

});

app.post('/users/login', async (req, res) => {
  const {username, password} = req.headers;

  const user = await User.findOne({username, password});
  if(user) {
    const token = createUserJWT({username, role: "user"});
    return res.status(200).json({message: "Logged in successfully", token});
  } else {
    return res.status(403).json({message: "Invalid username or password"}); 
  }
});

app.get('/users/courses', userAuth, async (req, res) => {
  const courses = await Course.find({});

  return res.status(200).json({courses});
});

app.post('/users/courses/:courseId', userAuth, async(req, res) => {
  const courseId = req.params.courseId;

  try {
    const course = await Course.findById(courseId);
    const username = req.user.username;
    const user = await User.findOne({username});

    if(user) {
      user.purchasedCourses.push(course);
      await user.save();
      return res.status(200).json({message: "Course purchased successfully."});
    } else {
      return res.status(403).json({message: "User does not exist."});
    }
  } catch (error){
    return res.status(403).json({message: "Course does not exist.", error});
  }
});

app.get('/users/purchasedCourses', userAuth, async (req, res) => {
  const {username} = req.user;

  try{
    const user = await User.findOne({username}).populate("purchasedCourses");
    return res.status(200).json({purchasedCourses: user.purchasedCourses || []});
  } catch(error) {
    return res.status(403).json({message: "User does not exist.", error});
  }
});

//mongoDB connection
mongoose.connect('mongodb+srv://rishabh:rishabh@cluster0.cx2xf0g.mongodb.net/courseDB')
.then(() => {
  app.listen(3000, () => {
    console.log('Server is listening on port 3000');
  });  
}).catch(error => console.log('Error while connecting to DB', error));

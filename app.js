const express = require("express");
const app = express();
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
const saltRounds = 10;
app.use(cookieParser())
var jwt = require('jsonwebtoken');
app.set('view engine', 'ejs');
const userModel = require('./models/user');
const postModel = require('./models/post');
const multer = require('multer');
const path = require('path');
app.use('/uploads', express.static('uploads'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

function isLoggedIn(req, res, next) {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, 'secret', (err, decoded) => {
            if (err) return res.redirect('/login');
            req.user = decoded; // Now req.user will have email and userId
            next();
        });
    } else {
        res.redirect('/login');
    }
}



function isLoggedOut(req, res, next) {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, 'secret', (err) => {
            if (err) return next();
            return res.redirect('/');
        });
    } else {
        next();
    }
}



app.get('/', async function (req, res) {
    const token = req.cookies.token;
    try {
        const posts = await postModel.find().populate('author', 'username image'); // Fetch posts and populate author details

        if (token) {
            const decoded = jwt.verify(token, 'secret');
            const user = await userModel.findOne({ email: decoded.email });

            // Render the index page with user and posts data
            res.render('index', { 
                name: user.username, 
                image: user.image,
                isLoggedIn: true, // User is logged in
                posts: posts // Pass posts with populated author data
            });
        } else {
            // Render the index page without user data but with posts data
            res.render('index', { 
                name: null, 
                image: null, 
                isLoggedIn: false, 
                posts: posts // Pass posts with populated author data
            });
        }
    } catch (err) {
        console.log("Error:", err);
        res.render('index', { name: null, image: null, isLoggedIn: false, posts: [] });
    }
});




app.get('/users', async (req, res) => {
    try {
      const users = await userModel.find(); // Fetch all users from the database
      res.json(users); // Send the data as JSON response
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });



app.post('/register', upload.single('image'), async function (req, res) {
    const { username, email, password } = req.body;
    const image = req.file ? req.file.path : null;

    if (!username || !email || !password || !image) {
        return res.status(400).send({ error: 'All fields are required' });
    }

    try {
        bcrypt.genSalt(saltRounds, async function (err, salt) {
            if (err) return res.status(500).send({ error: 'Error generating salt' });

            bcrypt.hash(password, salt, async function (err, hash) {
                if (err) return res.status(500).send({ error: 'Error hashing password' });

                try {
                    await userModel.create({
                        username, email, password: hash, image
                    });

                    res.cookie('loginPrefill', { email, password }, { maxAge: 5000, httpOnly: false });
                    res.redirect('/login');
                } catch (error) {
                    res.status(500).send({ error: 'Error creating user in database' });
                }
            });
        });
    } catch (error) {
        res.status(500).send({ error: 'Server error' });
    }
});

app.get('/register', isLoggedOut, function(req, res) {
    res.render('register');
});

app.get('/login', isLoggedOut, function(req, res) {
    const loginPrefill = req.cookies.loginPrefill || {};
    res.clearCookie('loginPrefill');
    res.render('login', { email: loginPrefill.email || '', password: loginPrefill.password || '' });
});

app.post('/login', async function (req, res) {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });

        if (!user) return res.send("User not found");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.send("Invalid password");

        const token = jwt.sign(
            { email: user.email, userId: user._id },  // Include userId in the token
            "secret"
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});

 // Protected route to render the Create Blog page (on POST request)
 app.get('/create-post', isLoggedIn, (req, res) => {
    const user = req.user; // Assuming isLoggedIn sets req.user
  
    res.render('create-post', {
      user,
      name: user?.username || null,
      image: user?.image || null,
      success: req.flash ? req.flash('success') : null
    });
  });

// Create a new blog post 
app.post('/create-post', isLoggedIn, upload.single('image'), async (req, res) => {
    const { title, content } = req.body;

    const image = req.file ? req.file.path : null;  // Image path from multer

    // Validate title and content
    if (!title || !content) {
        return res.status(400).send({ error: 'Title and content are required' });
    }

    try {
        // 1. Create the new blog post in the database with author set to the logged-in user's ID
        const newPost = await postModel.create({
            title,
            content,
            image,
            author: req.user.userId // Use 'author' instead of 'userId' to match your schema
        });

        // 2. Find the user by their ID
        const user = await userModel.findById(req.user.userId); // Use userId from decoded token

        // 3. Check if user exists
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }

        // 4. Add the new post ID into the user's posts array
        user.posts.push(newPost._id);

        // 5. Save the updated user document with the new post
        await user.save();

        // Respond with a success message or redirect to the appropriate page
        // res.send('Your post has been created successfully!');
        res.redirect('/'); // Redirect to home page after post creation
        
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to create blog post' });
    }
});


// Route to display blog details
app.get('/posts/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        // Find the post by its ID and populate the author data
        const post = await postModel.findById(postId).populate('author', 'username image');
        
        // Check if the post exists
        if (!post) {
            return res.status(404).send('Post not found');
        }

        // Render the blog detail page with the post data
        res.render('blog-details', {
            post: post,
            isLoggedIn: req.isLoggedIn,  // Optional: You can check if the user is logged in
        });

        console.log("Post :",post)
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching post details');
    }
});


// app.get('/profile', isLoggedIn, function(req, res) {
//     console.log({ user: req.user }); 
//     res.render('profile', { user: req.user }); 
// });

app.get('/profile', isLoggedIn, async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Fetch full user details
      const user = await userModel.findById(userId);
  
      // Fetch all posts created by this user
      const posts = await postModel.find({ author: userId });
  
    //   console.log({ user, posts });
  
      // Send both user and posts to EJS
      res.render('profile', { user, posts });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });
  
  app.post('/posts/:id/delete', isLoggedIn, async (req, res) => {
    try {
      // Find the post by ID
      const post = await postModel.findById(req.params.id);
      
      // Check if the post exists and if the current user is the author
      if (!post) {
        return res.status(404).send("Post not found.");
      }
      
      if (post.author.toString() !== req.user.userId) {
        return res.status(403).send("You are not authorized to delete this post.");
      }
  
      // Delete the post using findByIdAndDelete
      await postModel.findByIdAndDelete(req.params.id);
  
      // Redirect to the profile page after deletion
      res.redirect('/profile');
    } catch (error) {
      console.error(error);
      res.status(500).send("Error deleting post.");
    }
  });
  
  // Get the form to edit the post
app.get('/posts/:id/edit', isLoggedIn, async (req, res) => {
    try {
      // Find the post by ID
      const post = await postModel.findById(req.params.id);
  
      // Check if the post exists and if the current user is the author
      if (!post) {
        return res.status(404).send("Post not found.");
      }
  
      if (post.author.toString() !== req.user.userId) {
        return res.status(403).send("You are not authorized to edit this post.");
      }
  
      // Render the edit form with the current post data
      res.render('edit', { post });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error loading post.");
    }
  });
// Update the post after editing
app.post('/posts/:id/edit', isLoggedIn, async (req, res) => {
    try {
      // Find the post by ID
      const post = await postModel.findById(req.params.id);
  
      // Check if the post exists and if the current user is the author
      if (!post) {
        return res.status(404).send("Post not found.");
      }
  
      if (post.author.toString() !== req.user.userId) {
        return res.status(403).send("You are not authorized to edit this post.");
      }
  
      // Update the post with the new data
      post.title = req.body.title;
      post.content = req.body.content;
  
      // Save the updated post
      await post.save();
  
      // Redirect to the profile page after updating
      res.redirect('/profile');
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating post.");
    }
  });
    

app.post('/logout', function(req, res) {
    res.clearCookie('token');
    res.redirect('/');
});


app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});

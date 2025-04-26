const mongoose = require('mongoose');

// Use environment variable for MongoDB URI
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  image: String, // Store image URL or filename
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'post', // Must match the model name of the post schema
    }
  ]
});

module.exports = mongoose.model('user', userSchema);

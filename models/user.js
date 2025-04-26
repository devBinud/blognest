const mongoose = require('mongoose');

mongoose.connect(`mongodb://127.0.0.1:27017/blognest`, {
});

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

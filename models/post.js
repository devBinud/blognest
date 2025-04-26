const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',  // Reference to the 'user' model (lowercase 'user')
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',  // Users who liked this post (reference to 'user' model)
    }
  ],
  image: {
    type: String,
    default: '',  // Stores the image file path or URL
  }
});

module.exports = mongoose.model('post', postSchema);  // 'post' model (lowercase)

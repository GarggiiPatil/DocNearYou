const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide blog title'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please provide blog content']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  category: {
    type: String,
    default: 'General'
  },
  tags: [{
    type: String
  }],
  image: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Blog', blogSchema);
const express = require('express');
const router = express.Router();
const {
  createBlog,
  getAllBlogs,
  getBlog,
  getDoctorBlogs,
  updateBlog,
  deleteBlog,
  getPublishedBlogs,
  incrementView
} = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/auth');

// SPECIFIC ROUTES FIRST (exact string matches)
router.get('/published', getPublishedBlogs);
router.get('/my-blogs', protect, authorize('doctor'), getDoctorBlogs);
router.post('/', protect, authorize('doctor'), createBlog);

// DYNAMIC ROUTES WITH ACTIONS
router.post('/:id/view', incrementView);

// DYNAMIC ROUTES (MUST BE LAST)
router.put('/:id', protect, authorize('doctor'), updateBlog);
router.delete('/:id', protect, authorize('doctor'), deleteBlog);
router.get('/:id', getBlog);  // THIS MUST BE AFTER /published

// ROOT ROUTE
router.get('/', getAllBlogs);

module.exports = router;
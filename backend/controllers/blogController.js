const Blog = require('../models/Blog');

// @desc    Create blog
// @route   POST /api/blogs
// @access  Private (Doctor)
exports.createBlog = async (req, res) => {
  try {
    const { title, content, category, tags, image, isPublished } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and content'
      });
    }

    const blog = await Blog.create({
      title,
      content,
      category: category || 'General',
      tags: tags || [],
      image: image || '',
      isPublished: isPublished !== undefined ? isPublished : true,
      author: req.user._id
    });

    const populatedBlog = await Blog.findById(blog._id)
      .populate('author', 'name email specialization');

    return res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: populatedBlog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating blog',
      error: error.message
    });
  }
};

// @desc    Get all blogs (public)
// @route   GET /api/blogs
// @access  Public
exports.getAllBlogs = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name email specialization')
      .sort('-createdAt');

    return res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message
    });
  }
};

// @desc    Get all published blogs (for patients)
// @route   GET /api/blogs/published
// @access  Public
exports.getPublishedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .populate('author', 'name email specialization')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Error fetching published blogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch published blogs',
      error: error.message
    });
  }
};

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email specialization hospital');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Don't increment views here, use the separate endpoint
    return res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching blog',
      error: error.message
    });
  }
};

// @desc    Increment blog view count
// @route   POST /api/blogs/:id/view
// @access  Public
exports.incrementView = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error incrementing view:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to increment view',
      error: error.message
    });
  }
};

// @desc    Get doctor's blogs
// @route   GET /api/blogs/my-blogs
// @access  Private (Doctor)
exports.getDoctorBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .sort('-createdAt');

    return res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (Doctor)
exports.updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }

    const { title, content, category, tags, image, isPublished } = req.body;

    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { title, content, category, tags, image, isPublished },
      { new: true, runValidators: true }
    ).populate('author', 'name email specialization');

    return res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating blog',
      error: error.message
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (Doctor)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }

    await blog.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting blog',
      error: error.message
    });
  }
};

exports.getPublishedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .populate('author', 'name email specialization')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Error fetching published blogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch published blogs',
      error: error.message
    });
  }
};

exports.incrementView = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error incrementing view:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to increment view',
      error: error.message
    });
  }
};
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { blogAPI } from '../services/api';

const DoctorBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: '',
    isPublished: true
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await blogAPI.getDoctorBlogs();
      setBlogs(response.data.data);
    } catch (err) {
      toast.error('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please provide title and content');
      return;
    }

    setLoading(true);
    try {
      const blogData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      if (editingBlog) {
        await blogAPI.update(editingBlog._id, blogData);
        toast.success('Blog updated successfully');
      } else {
        await blogAPI.create(blogData);
        toast.success('Blog created successfully');
      }

      setFormData({ title: '', content: '', category: 'General', tags: '', isPublished: true });
      setShowForm(false);
      setEditingBlog(null);
      fetchBlogs();
    } catch (err) {
      toast.error(editingBlog ? 'Failed to update blog' : 'Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      category: blog.category,
      tags: blog.tags.join(', '),
      isPublished: blog.isPublished
    });
    setShowForm(true);
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    
    try {
      await blogAPI.delete(blogId);
      toast.success('Blog deleted successfully');
      fetchBlogs();
    } catch (err) {
      toast.error('Failed to delete blog');
    }
  };

  const categories = ['General', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Other'];

  if (loading && !showForm) return <div className="loading">Loading blogs...</div>;

  return (
    <div className="container">
      <div className="dashboard">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1>My Blogs!</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!showForm && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowForm(true);
                  setEditingBlog(null);
                  setFormData({ title: '', content: '', category: 'General', tags: '', isPublished: true });
                }}
              >
                + Write New Blog
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => navigate('/doctor/dashboard')}>Back</button>
          </div>
        </div>

        {showForm ? (
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2>{editingBlog ? 'Edit Blog' : 'Write New Blog'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter blog title..."
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="health, wellness, tips"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed' }}
                />
              </div>

              <div className="form-group">
                <label>Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your blog content here..."
                  rows="15"
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e1e8ed', fontFamily: 'inherit' }}
                />
                <small style={{ color: '#666' }}>Tip: Use clear paragraphs and subheadings for better readability</small>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span>Publish immediately</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingBlog ? 'Update Blog' : 'Publish Blog')}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingBlog(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {blogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: '#f5f5f5', borderRadius: '15px' }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>✍️</div>
                <h3>No blogs yet</h3>
                <p style={{ color: '#666' }}>Start writing to share your medical knowledge with patients!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {blogs.map(blog => (
                  <div key={blog._id} style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      background: blog.isPublished ? '#4caf50' : '#ff9800',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {blog.isPublished ? 'Published' : 'Draft'}
                    </div>

                    <h2 style={{ color: '#667eea', marginBottom: '10px', marginRight: '100px' }}>{blog.title}</h2>
                    
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                      <span>📁 {blog.category}</span>
                      <span>👁️ {blog.views} views</span>
                      <span>📅 {new Date(blog.createdAt).toLocaleDateString()}</span>
                    </div>

                    {blog.tags && blog.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        {blog.tags.map((tag, idx) => (
                          <span key={idx} style={{
                            padding: '4px 12px',
                            background: '#e3f2fd',
                            color: '#2196f3',
                            borderRadius: '15px',
                            fontSize: '12px'
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <p style={{
                      color: '#666',
                      lineHeight: '1.6',
                      marginBottom: '20px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {blog.content}
                    </p>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleEdit(blog)}
                        style={{
                          padding: '8px 16px',
                          background: '#2196f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(blog._id)}
                        style={{
                          padding: '8px 16px',
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorBlogs;
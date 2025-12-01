import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { blogAPI } from '../services/api';

const PatientHealthBlogs = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlog, setSelectedBlog] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      console.log('Fetching blogs from /api/blogs/published...');
      
      const response = await blogAPI.getPublishedBlogs();
      console.log('Full API Response:', response);
      console.log('Response data:', response.data);
      
      // Handle different response structures
      let blogsData = [];
      if (response.data?.data) {
        blogsData = response.data.data;
        console.log('Blogs from response.data.data:', blogsData);
      } else if (Array.isArray(response.data)) {
        blogsData = response.data;
        console.log('Blogs from response.data (array):', blogsData);
      } else if (response.data) {
        blogsData = [response.data];
        console.log('Single blog from response.data:', blogsData);
      }
      
      // Filter only published blogs
      const publishedBlogs = blogsData.filter(blog => blog.isPublished === true);
      console.log('Published blogs after filter:', publishedBlogs);
      console.log('Total published blogs:', publishedBlogs.length);
      
      setBlogs(publishedBlogs);
    } catch (err) {
      console.error('Fetch error:', err);
      console.error('Error response:', err.response);
      toast.error('Failed to fetch health blogs: ' + (err.response?.data?.message || err.message));
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBlogClick = async (blog) => {
    setSelectedBlog(blog);
    // Increment view count
    try {
      await blogAPI.incrementView(blog._id);
      // Update local state
      setBlogs(prevBlogs => 
        prevBlogs.map(b => 
          b._id === blog._id ? { ...b, views: (b.views || 0) + 1 } : b
        )
      );
      // Update selected blog views
      setSelectedBlog(prev => ({ ...prev, views: (prev.views || 0) + 1 }));
    } catch (err) {
      console.error('Failed to increment view count:', err);
    }
  };

  const categories = ['All', 'General', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Other'];

  const filteredBlogs = blogs.filter(blog => {
    const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory;
    const matchesSearch = 
      blog.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.tags && Array.isArray(blog.tags) && blog.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="container">
        <div className="dashboard">
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
            <h3>Loading health blogs...</h3>
            <p style={{ color: '#666', marginTop: '10px' }}>Please wait while we fetch the latest articles</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard">
        {selectedBlog ? (
          // Full Blog View
          <div>
            <button 
              className="btn btn-secondary" 
              onClick={() => setSelectedBlog(null)}
              style={{ marginBottom: '20px' }}
            >
              ← Back to Blogs
            </button>
            
            <div style={{ 
              background: 'white', 
              padding: '40px', 
              borderRadius: '15px', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)' 
            }}>
              <h1 style={{ color: '#667eea', marginBottom: '20px' }}>{selectedBlog.title}</h1>
              
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                marginBottom: '20px', 
                paddingBottom: '20px', 
                borderBottom: '2px solid #e1e8ed',
                fontSize: '14px',
                color: '#666',
                flexWrap: 'wrap'
              }}>
                <span>👨‍⚕️ Dr. {selectedBlog.author?.name || 'Anonymous'}</span>
                <span>📁 {selectedBlog.category}</span>
                <span>👁️ {selectedBlog.views || 0} views</span>
                <span>📅 {new Date(selectedBlog.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>

              {selectedBlog.tags && Array.isArray(selectedBlog.tags) && selectedBlog.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '30px', flexWrap: 'wrap' }}>
                  {selectedBlog.tags.map((tag, idx) => (
                    <span key={idx} style={{
                      padding: '6px 14px',
                      background: '#e3f2fd',
                      color: '#2196f3',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{
                color: '#333',
                lineHeight: '1.8',
                fontSize: '16px',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedBlog.content}
              </div>

              {selectedBlog.author && (
                <div style={{
                  marginTop: '40px',
                  padding: '20px',
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  borderLeft: '4px solid #667eea'
                }}>
                  <h4 style={{ marginBottom: '10px', color: '#667eea' }}>About the Author</h4>
                  <p style={{ margin: 0, color: '#666' }}>
                    <strong>Dr. {selectedBlog.author.name}</strong><br />
                    {selectedBlog.author.specialization && `${selectedBlog.author.specialization} Specialist`}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Blog List View
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
              <h1>Health Blogs!</h1>
              <button className="btn btn-secondary" onClick={() => navigate('/patient/dashboard')}>
                Back to Dashboard
              </button>
            </div>

            {/* Debug Info - Remove after fixing */}
            {blogs.length === 0 && (
              <div style={{ 
                background: '#fff3cd', 
                border: '1px solid #ffc107', 
                padding: '15px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                <strong>🔍 Debug Info:</strong> No blogs found. Check browser console for API response details.
              </div>
            )}

            {/* Search and Filter Section */}
            <div style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '15px', 
              marginBottom: '30px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search blogs by title, content, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '2px solid #e1e8ed',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      background: selectedCategory === cat ? '#667eea' : '#e1e8ed',
                      color: selectedCategory === cat ? 'white' : '#666',
                      cursor: 'pointer',
                      fontWeight: selectedCategory === cat ? 'bold' : 'normal',
                      transition: 'all 0.3s'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? 'blog' : 'blogs'}
              {blogs.length > 0 && ` (Total: ${blogs.length})`}
            </p>

            {/* Blogs Grid */}
            {filteredBlogs.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px', 
                background: '#f5f5f5', 
                borderRadius: '15px' 
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>📚</div>
                <h3>No blogs found</h3>
                <p style={{ color: '#666' }}>
                  {searchQuery || selectedCategory !== 'All' 
                    ? 'Try adjusting your filters or search query' 
                    : 'Check back later for health articles from our doctors'}
                </p>
                {blogs.length === 0 && (
                  <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>
                    Make sure doctors have published blogs with "isPublished: true"
                  </p>
                )}
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '20px' 
              }}>
                {filteredBlogs.map(blog => (
                  <div 
                    key={blog._id} 
                    onClick={() => handleBlogClick(blog)}
                    style={{
                      background: 'white',
                      padding: '25px',
                      borderRadius: '15px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      padding: '4px 10px',
                      borderRadius: '15px',
                      background: '#e3f2fd',
                      color: '#2196f3',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      {blog.category}
                    </div>

                    <h3 style={{ 
                      color: '#667eea', 
                      marginBottom: '12px',
                      marginRight: '80px',
                      fontSize: '18px',
                      lineHeight: '1.4'
                    }}>
                      {blog.title}
                    </h3>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      marginBottom: '12px', 
                      fontSize: '13px', 
                      color: '#666',
                      flexWrap: 'wrap'
                    }}>
                      <span>👨‍⚕️ Dr. {blog.author?.name || 'Anonymous'}</span>
                      <span>👁️ {blog.views || 0}</span>
                      <span>📅 {new Date(blog.createdAt).toLocaleDateString()}</span>
                    </div>

                    {blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0 && (
                      <div style={{ 
                        display: 'flex', 
                        gap: '6px', 
                        marginBottom: '12px', 
                        flexWrap: 'wrap' 
                      }}>
                        {blog.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} style={{
                            padding: '3px 10px',
                            background: '#f0f0f0',
                            color: '#666',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }}>
                            #{tag}
                          </span>
                        ))}
                        {blog.tags.length > 3 && (
                          <span style={{
                            padding: '3px 10px',
                            color: '#666',
                            fontSize: '11px'
                          }}>
                            +{blog.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <p style={{
                      color: '#666',
                      lineHeight: '1.6',
                      fontSize: '14px',
                      marginBottom: '15px',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {blog.content}
                    </p>

                    <div style={{
                      color: '#667eea',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      Read more →
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

export default PatientHealthBlogs;
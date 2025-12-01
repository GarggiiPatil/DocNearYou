// src/pages/HealthChatbot.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { chatbotAPI } from '../services/api';
import { MessageCircle, Send, Loader, Clock, Sparkles } from 'lucide-react';

const HealthChatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hi, I'm your DocNearYou AI health assistant. 💙\n\nYou can ask me about common symptoms, conditions, general wellness, and when to visit a doctor.\n\n⚠️ I do *not* provide diagnosis or prescriptions. For serious concerns, please consult a doctor.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [commonQuestions, setCommonQuestions] = useState([]);
  const [showQuestions, setShowQuestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchCommonQuestions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length > 0) {
      setShowQuestions(false);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCommonQuestions = async () => {
    try {
      const response = await chatbotAPI.getCommonQuestions();
      setCommonQuestions(response.data.data);
    } catch (err) {
      console.error('Error fetching common questions:', err);
    }
  };

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    setTimeout(() => inputRef.current?.focus(), 100);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        content: msg.content
      }));

      const response = await chatbotAPI.sendMessage(messageText, conversationHistory);

      const data = response.data.data || {};
      const assistantMessage = {
        role: 'assistant',
        content: data.message || 'Sorry, I could not generate a response.',
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        fallback: data.method === 'fallback' || data.fallback,
        model: data.model || data.method || 'semantic-rag'
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (assistantMessage.fallback) {
        toast.warning('Response generated from fallback mode', { autoClose: 2000 });
      } else if (assistantMessage.model === 'semantic-rag') {
        toast.info('Answered using AI health knowledge base (RAG)', { autoClose: 2000 });
      }
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Failed to get response. Please try again.');

      const errorMessage = {
        role: 'assistant',
        content:
          "I'm having trouble connecting right now. Please try again in a moment, or you can:\n\n• Book an appointment with a doctor through our platform\n• Call emergency services (911/108) for urgent issues\n• Visit your nearest hospital for serious symptoms",
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = (question) => {
    sendMessage(question);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          "Hi, I'm your DocNearYou AI health assistant. 💙\n\nYou can ask me about common symptoms, conditions, general wellness, and when to visit a doctor.\n\n⚠️ I do *not* provide diagnosis or prescriptions. For serious concerns, please consult a doctor.",
        timestamp: new Date()
      }
    ]);
    setShowQuestions(true);
    toast.success('Chat cleared');
  };

  const formatMessage = (content) => {
    let formatted = content || '';

    // Bold (**text**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Bullet points
    formatted = formatted.replace(/^[•\-*]\s+(.+)$/gm, '<li>$1</li>');

    if (formatted.includes('<li>')) {
      formatted = formatted.replace(
        /(<li>.*<\/li>)/gs,
        '<ul style="margin: 10px 0; padding-left: 20px;">$1</ul>'
      );
    }

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br/>');

    return formatted;
  };

  return (
    <div
      className="container"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            background: 'white',
            borderRadius: '15px 15px 0 0',
            padding: '20px 25px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={24} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px' }}>AI Health Assistant!</h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>
                Powered by DocNearYou health knowledge base (RAG model)
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-outline-secondary"
              onClick={clearChat}
              style={{ fontSize: '14px' }}
            >
              Clear Chat
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/patient/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Common Questions */}
        {showQuestions && commonQuestions.length > 0 && (
          <div
            style={{
              background: 'white',
              padding: '20px 25px',
              borderTop: '1px solid #e1e8ed'
            }}
          >
            <h3
              style={{
                margin: '0 0 15px 0',
                fontSize: '16px',
                color: '#333'
              }}
            >
              💡 Common Questions
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '10px'
              }}
            >
              {commonQuestions.slice(0, 6).map(q => (
                <button
                  key={q.id}
                  onClick={() => handleQuestionClick(q.question)}
                  style={{
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    border: '2px solid #e1e8ed',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '13px',
                    transition: 'all 0.3s',
                    color: '#333'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#e3f2fd';
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#e1e8ed';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <MessageCircle
                    size={14}
                    style={{ marginRight: '8px', display: 'inline' }}
                  />
                  {q.question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div
          style={{
            background: 'white',
            height: '500px',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: showQuestions ? '0' : '0 0 0 0'
          }}
        >
          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px'
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent:
                    msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animation: 'fadeIn 0.3s ease-in'
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '14px 18px',
                    borderRadius:
                      msg.role === 'user'
                        ? '20px 20px 5px 20px'
                        : '20px 20px 20px 5px',
                    background:
                      msg.role === 'user'
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : msg.error
                        ? '#ffebee'
                        : '#f5f5f5',
                    color: msg.role === 'user' ? 'white' : '#333',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}
                >
                  {msg.fallback && (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#ff9800',
                        marginBottom: '8px',
                        fontWeight: 'bold'
                      }}
                    >
                      ⚠️ Fallback Mode
                    </div>
                  )}
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: '1.5'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(msg.content)
                    }}
                  />
                  <div
                    style={{
                      fontSize: '11px',
                      marginTop: '8px',
                      opacity: 0.7,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Clock size={12} />
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {msg.model && (
                      <span style={{ marginLeft: '5px', fontSize: '10px' }}>
                        • {msg.model}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '20px 20px 20px 5px',
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <Loader size={16} className="spin" />
                  <span style={{ color: '#666' }}>AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '20px',
              borderTop: '2px solid #e1e8ed',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              background: '#fafbfc',
              borderRadius: '0 0 15px 15px'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me about your health concerns..."
              style={{
                flex: 1,
                padding: '14px 20px',
                borderRadius: '25px',
                border: '2px solid #e1e8ed',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              disabled={loading}
              onFocus={e => (e.target.style.borderColor = '#667eea')}
              onBlur={e => (e.target.style.borderColor = '#e1e8ed')}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                padding: '14px 24px',
                background:
                  loading || !input.trim()
                    ? '#ccc'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                cursor:
                  loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s',
                fontSize: '14px'
              }}
              onMouseOver={e => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? (
                <>
                  <Loader size={16} className="spin" />
                  Sending
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        ul {
          list-style-type: disc;
        }

        li {
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
};

export default HealthChatbot;
import React, { useState } from 'react';
import './help.css';

function Help({ onBack }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      const response = await fetch('http://localhost:5000/support/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          role: 'mentor', // Set role as mentor
          submittedAt: new Date().toISOString() 

        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setForm({ name: '', email: '', message: '' });
      } else {
        const errorData = await response.json();
        setSubmitStatus('error');
        console.error('Submission failed:', errorData.error);
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="help-container">
      <div className="help-card">
        <h1 className="help-title">
          Support & Help
        </h1>
        <p className="help-subtitle">
          We're here to help! Explore our resources or contact us directly.
        </p>

        <div className="faq-section">
          <h2 className="faq-title">Frequently Asked Questions</h2>
          <ul className="faq-list">
            <li><strong>How do I change my password?</strong> — Go to Settings → Account → Change Password.</li>
            <li><strong>Where can I manage notifications?</strong> — Settings → Notifications.</li>
            <li><strong>How to delete my account?</strong> — Settings → Delete Account.</li>
            <li><strong>What are preferred fields?</strong> — Topics you're interested in for personalized recommendations.</li>
            <li><strong>How do I track learning goals?</strong> — Set them in your profile. Track progress on the dashboard.</li>
          </ul>
        </div>

        <div className="contact-section">
          <h2 className="contact-title">Contact Support</h2>
          
          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="success-message">
              ✅ Support request submitted successfully! We'll get back to you soon.
            </div>
          )}
          
          {submitStatus === 'error' && (
            <div className="error-message">
              ❌ Failed to submit support request. Please try again.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="contact-form">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={form.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
            <textarea
              name="message"
              placeholder="Describe your issue or question"
              value={form.message}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Help;

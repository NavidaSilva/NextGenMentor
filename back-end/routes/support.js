const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');

// Submit support request (mentors and mentees)
router.post('/submit', async (req, res) => {
  try {
    const { name, email, message, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !message || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Validate role
    if (!['mentor', 'mentee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const supportRequest = new SupportRequest({ 
      name, 
      email, 
      message, 
      role,
      submittedAt: new Date() // Explicitly set the current date
    });
    
    await supportRequest.save();
    res.status(201).json({ 
      message: 'Support request submitted successfully',
      id: supportRequest._id
    });
  } catch (error) {
    console.error('Support request submission error:', error);
    res.status(500).json({ error: 'Failed to submit support request' });
  }
});

// Get all support requests (admin only)
router.get('/admin', async (req, res) => {
  try {
    const requests = await SupportRequest.find()
      .sort({ submittedAt: -1 })
      .select('-__v');
    res.json(requests);
  } catch (error) {
    console.error('Fetch support requests error:', error);
    res.status(500).json({ error: 'Failed to fetch support requests' });
  }
});

// Resolve support request (admin only)
router.put('/admin/:id/resolve', async (req, res) => {
  try {
    const request = await SupportRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'resolved', 
        resolvedAt: new Date()
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ error: 'Support request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Resolve request error:', error);
    res.status(500).json({ error: 'Failed to resolve request' });
  }
});

// Ignore support request (admin only) - moves to bottom of list
router.put('/admin/:id/ignore', async (req, res) => {
  try {
    const request = await SupportRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'ignored'
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ error: 'Support request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Ignore request error:', error);
    res.status(500).json({ error: 'Failed to ignore request' });
  }
});

// Delete support request (admin only)
router.delete('/admin/:id', async (req, res) => {
  try {
    const request = await SupportRequest.findByIdAndDelete(req.params.id);
    
    if (!request) {
      return res.status(404).json({ error: 'Support request not found' });
    }
    
    res.json({ message: 'Support request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});

// Get support request statistics (admin only)
router.get('/admin/stats', async (req, res) => {
  try {
    const stats = await SupportRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await SupportRequest.countDocuments();
    const pending = await SupportRequest.countDocuments({ status: 'pending' });
    const resolved = await SupportRequest.countDocuments({ status: 'resolved' });
    const ignored = await SupportRequest.countDocuments({ status: 'ignored' });
    
    res.json({
      total,
      pending,
      resolved,
      ignored,
      breakdown: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
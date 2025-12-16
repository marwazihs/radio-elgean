const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5001';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index', { title: 'Radio Elgean' });
});

app.get('/api/data', async (req, res) => {
  try {
    const response = await axios.get(`${FLASK_API_URL}/api/data`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching from Flask API:', error.message);
    res.status(500).json({ error: 'Failed to fetch data from API' });
  }
});

app.get('/api/metadata', async (req, res) => {
  try {
    const response = await axios.get('https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json', {
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching metadata:', error.message);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

app.get('/api/user-ip', (req, res) => {
  // Get client IP from various headers, fallback to remote address
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
             req.headers['x-real-ip'] ||
             req.socket.remoteAddress ||
             'unknown';
  res.json({ status: 'success', ip });
});

// Proxy endpoint for liking tracks
app.post('/api/tracks/like', async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_API_URL}/api/tracks/like`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error liking track:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to like track' });
  }
});

// Proxy endpoint for checking like status
app.post('/api/tracks/is-liked', async (req, res) => {
  try {
    const response = await axios.post(`${FLASK_API_URL}/api/tracks/is-liked`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error checking like status:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to check like status' });
  }
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
  console.log(`Connected to Flask API at ${FLASK_API_URL}`);
});

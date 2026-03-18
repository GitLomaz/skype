const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// API endpoint to get Firebase config from environment variables
app.get('/api/config', (req, res) => {
  res.json({
    apiKey: process.env.SKYPE_API_KEY || '',
    authDomain: process.env.SKYPE_AUTH_DOMAIN || '',
    projectId: process.env.SKYPE_PROJECT_ID || '',
    storageBucket: process.env.SKYPE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.SKYPE_MESSAGING_SENDER_ID || '',
    appId: process.env.SKYPE_APP_ID || ''
  });
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

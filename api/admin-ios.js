const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('Admin iOS API - Method:', req.method, 'URL:', req.url);

  try {
    if (req.method === 'GET') {
      // Always serve iOS admin interface for GET requests
      const adminHtml = fs.readFileSync(path.join(__dirname, '..', 'admin-ios.html'), 'utf8');
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(adminHtml);
    }

    if (req.method === 'POST') {
      // Save flow configuration
      if (req.url.includes('save-flow')) {
        const configPath = path.join(__dirname, '..', 'flow-config.json');
        const newConfig = JSON.stringify(req.body, null, 2);
        
        // Backup current config
        const backupPath = path.join(__dirname, '..', `flow-config-backup-${Date.now()}.json`);
        if (fs.existsSync(configPath)) {
          fs.copyFileSync(configPath, backupPath);
        }
        
        // Save new config
        fs.writeFileSync(configPath, newConfig);
        
        return res.status(200).json({ 
          success: true, 
          message: 'フロー設定を保存しました',
          backup: backupPath
        });
      }
    }

    // 404 for unknown routes
    res.status(404).json({ error: 'Not found' });
    
  } catch (error) {
    console.error('Admin iOS API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
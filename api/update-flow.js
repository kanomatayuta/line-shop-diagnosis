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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const configPath = path.join(__dirname, '..', 'flow-config.json');
    
    // Parse request body
    let body = '';
    for await (const chunk of req) {
      body += chunk.toString();
    }
    const flowConfig = JSON.parse(body);

    // Validate basic structure
    if (!flowConfig.flowConfig) {
      return res.status(400).json({ error: 'Invalid flow configuration structure' });
    }

    // Update metadata
    if (!flowConfig.metadata) {
      flowConfig.metadata = {};
    }
    flowConfig.metadata.lastUpdated = new Date().toISOString().split('T')[0];
    flowConfig.metadata.version = flowConfig.metadata.version || '1.0';

    // Create backup
    const backupPath = path.join(__dirname, '..', `flow-config-backup-${Date.now()}.json`);
    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, backupPath);
    }

    // Save new configuration
    fs.writeFileSync(configPath, JSON.stringify(flowConfig, null, 2));

    console.log('Flow configuration updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Flow configuration updated successfully',
      backup: backupPath,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating flow configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update flow configuration',
      details: error.message
    });
  }
};
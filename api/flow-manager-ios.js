const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const flowManagerJs = fs.readFileSync(path.join(__dirname, '..', 'flow-manager-ios.js'), 'utf8');
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(flowManagerJs);
  } catch (error) {
    console.error('Error serving flow-manager-ios.js:', error);
    res.status(500).json({ error: 'Failed to load flow manager script' });
  }
};
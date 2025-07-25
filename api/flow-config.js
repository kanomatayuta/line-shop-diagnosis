const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const flowConfig = fs.readFileSync(path.join(__dirname, '..', 'flow-config.json'), 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).send(flowConfig);
  } catch (error) {
    console.error('Error serving flow-config.json:', error);
    res.status(500).json({ error: 'Failed to load flow configuration' });
  }
};
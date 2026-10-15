const { r } = require('../lib/redis');
const { valid, hash } = require('../lib/gumroad');
module.exports = async (req, res) => {
  try {
    const key = String(req.headers['x-license-key'] || '').trim();
    if (!(await valid(key))) return res.status(401).json({ error: 'Invalid or inactive license key.' });
    const rows = await r('LRANGE', 'leads:' + hash(key), 0, 99);
    res.json({ leads: (rows || []).map(x => JSON.parse(x)) });
  } catch (e) { res.status(500).json({ error: 'Server error.' }); }
};

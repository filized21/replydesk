const { r } = require('../lib/redis');
const { valid, hash } = require('../lib/gumroad');
module.exports = async (req, res) => {
  try {
    const key = String(req.headers['x-license-key'] || '').trim();
    if (!(await valid(key))) return res.status(401).json({ error: 'Invalid or inactive license key.' });
    const h = hash(key);
    if (req.method === 'GET') { const c = await r('GET', 'cfg:' + h); return res.json({ config: c ? JSON.parse(c) : null }); }
    if (req.method !== 'POST') return res.status(405).end();
    const b = req.body || {};
    const slug = String(b.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
    if (slug.length < 3) return res.status(400).json({ error: 'Your link name needs 3+ letters or numbers.' });
    const owner = await r('GET', 'slug:' + slug);
    if (owner && owner !== h) return res.status(409).json({ error: 'That link name is taken.' });
    const old = await r('GET', 'cfg:' + h);
    if (old && JSON.parse(old).slug !== slug) await r('DEL', 'slug:' + JSON.parse(old).slug);
    const f = (k, n = 2000) => String(b[k] || '').slice(0, n);
    const cfg = { slug, name: f('name', 80), type: f('type', 80), hours: f('hours'), address: f('address'), services: f('services'), payments: f('payments'), notes: f('notes'), emergency: f('emergency', 60) };
    if (!cfg.name) return res.status(400).json({ error: 'Business name is required.' });
    await r('SET', 'cfg:' + h, JSON.stringify(cfg));
    await r('SET', 'slug:' + slug, h);
    await r('SET', 'lk:' + h, key);
    res.json({ config: cfg });
  } catch (e) { res.status(500).json({ error: 'Server error.' }); }
};

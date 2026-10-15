const { r } = require('../lib/redis');
const { valid } = require('../lib/gumroad');
const buildPrompt = require('../lib/prompt');
const CAP = parseInt(process.env.MONTHLY_CAP || '1500', 10);
module.exports = async (req, res) => {
  try {
    const slug = String((req.query && req.query.slug) || (req.body && req.body.slug) || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const h = slug && await r('GET', 'slug:' + slug);
    const raw = h && await r('GET', 'cfg:' + h);
    if (!raw) return res.status(404).json({ error: 'This assistant does not exist.' });
    const cfg = JSON.parse(raw);
    if (req.method === 'GET') return res.json({ name: cfg.name });
    if (req.method !== 'POST') return res.status(405).end();
    if (!(await valid(await r('GET', 'lk:' + h)))) return res.status(403).json({ error: 'This assistant is currently inactive.' });
    const ip = String(req.headers['x-forwarded-for'] || 'x').split(',')[0].trim();
    const k = 'rl:' + ip + ':' + Math.floor(Date.now() / 60000);
    if ((await r('INCR', k)) === 1) await r('EXPIRE', k, 90);
    else if ((await r('GET', k)) > 20) return res.status(429).json({ error: 'Too many messages, please wait a moment.' });
    const uk = 'use:' + h + ':' + new Date().toISOString().slice(0, 7);
    if ((await r('INCR', uk)) > CAP) return res.status(429).json({ error: 'Monthly message limit reached.' });
    const msgs = (req.body.messages || []).slice(-20).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 1500) }));
    while (msgs.length && msgs[0].role !== 'user') msgs.shift();
    if (!msgs.length) return res.status(400).json({ error: 'Bad request.' });
    const x = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL || 'claude-sonnet-5-5', max_tokens: 500, system: buildPrompt(cfg), messages: msgs })
    });
    const d = await x.json();
    if (!x.ok) return res.status(502).json({ error: 'The assistant is unavailable right now.' });
    const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    for (const m of text.matchAll(/\[\[(booking|handoff):\s*([^\]]*)\]\]/g)) {
      await r('LPUSH', 'leads:' + h, JSON.stringify({ type: m[1], info: m[2].trim(), at: new Date().toISOString() }));
      await r('LTRIM', 'leads:' + h, 0, 199);
    }
    res.json({ text });
  } catch (e) { res.status(500).json({ error: 'Server error.' }); }
};

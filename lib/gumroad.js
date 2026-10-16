const crypto = require('crypto');
const { r } = require('./redis');
const hash = k => crypto.createHash('sha256').update(String(k).trim()).digest('hex').slice(0, 32);
// Checks a Gumroad license key. Set DEV_LICENSE_KEY to test without Gumroad.
async function valid(key) {
  key = String(key || '').trim();
  if (key.length < 8) return false;
  if (process.env.DEV_LICENSE_KEY && key === process.env.DEV_LICENSE_KEY) return true;
  const h = hash(key);
  if ((await r('GET', 'lic:' + h)) === '1') return true;
  const body = new URLSearchParams({ product_id: process.env.GUMROAD_PRODUCT_ID || '', license_key: key, increment_uses_count: 'false' });
  const x = await fetch('https://api.gumroad.com/v2/licenses/verify', { method: 'POST', body });
  const d = await x.json().catch(() => ({}));
  const p = d.purchase || {};
  const ok = !!d.success && !p.refunded && !p.chargebacked && !p.disputed && !p.subscription_cancelled_at && !p.subscription_failed_at;
  if (ok) await r('SET', 'lic:' + h, '1', 'EX', '600');
  return ok;
}
module.exports = { hash, valid };

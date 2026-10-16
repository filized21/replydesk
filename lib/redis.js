const U = process.env.UPSTASH_REDIS_REST_URL, T = process.env.UPSTASH_REDIS_REST_TOKEN;
exports.r = async (...cmd) => {
  const x = await fetch(U, { method: 'POST', headers: { Authorization: 'Bearer ' + T, 'content-type': 'application/json' }, body: JSON.stringify(cmd) });
  const d = await x.json();
  if (d.error) throw new Error(d.error);
  return d.result;
};

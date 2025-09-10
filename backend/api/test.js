export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://exambuddy-delta.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  res.status(200).json({ 
    message: 'API is working',
    method: req.method,
    url: req.url,
    headers: req.headers
  });
}
// POST /api/auth/login — verify PIN and return JWT
const router = require('express').Router();
const { generateToken } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { pin } = req.body;

  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' });
  }

  const correctPin = process.env.APP_PIN;
  if (!correctPin) {
    return res.status(500).json({ error: 'Server misconfiguration: APP_PIN not set' });
  }

  if (String(pin) !== String(correctPin)) {
    return res.status(401).json({ error: 'Incorrect PIN. Try again.' });
  }

  const token = generateToken();
  res.json({ token, message: 'Welcome back, Saiful! 🎯' });
});

module.exports = router;

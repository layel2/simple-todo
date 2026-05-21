const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const HOST = '0.0.0.0';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, HOST, () => {
  console.log(`TODO app running at http://${HOST}:${PORT}`);
});

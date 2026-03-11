require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const repoRoutes = require('./routes/repo');
const analysisRoutes = require('./routes/analysis');
const commitsRoutes = require('./routes/commits');
const dependenciesRoutes = require('./routes/dependencies');

const app = express();
const PORT = process.env.PORT || 4000;


app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGINS || '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use('/api/repo', repoRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/commits', commitsRoutes);
app.use('/api/dependencies', dependenciesRoutes);

app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} in use. Kill it with: taskkill /F /PID $(netstat -ano | findstr :${PORT})`);
    process.exit(1);
  }
});
module.exports = app;

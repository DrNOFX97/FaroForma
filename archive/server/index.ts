import express from 'express';
import path from 'path';
import apiRouter from './routes/api';

const app = express();
const PORT = process.env.PORT ?? 8080;

// API middleware
app.use('/api', express.json());
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve Vite build (dist/ is at project root, one level up from server/)
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

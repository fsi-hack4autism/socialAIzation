const express = require('express');
const { createServer: createViteServer } = require('vite');
const path = require('path');

// Ensure required environment variables are set
if (!process.env.PORT) {
  throw new Error('Environment variable PORT is required but not set.');
}
if (!process.env.NODE_ENV) {
  throw new Error('Environment variable NODE_ENV is required but not set.');
}

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT;

async function startServer() {
  const app = express();

  // API routes under /api
  app.use('/api', express.json());
  app.get('/api/example', (req, res) => {
    res.json({ message: 'Hello from API!' });
  });

  if (!isProduction) {
    // Vite middleware in development mode
    const vite = await createViteServer({
      server: { middlewareMode: 'html' },
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    // Handle all non-API routes to serve the SPA frontend
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer();

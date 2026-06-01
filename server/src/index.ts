import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth';
import comitesRoutes from './routes/comites';
import estadisticasRoutes from './routes/estadisticas';
import auditRoutes from './routes/audit';
import { initDb } from './database';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/comites', comitesRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/audit', auditRoutes);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ── Servir cliente estático en producción ──
const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log('✅ Sirviendo frontend estático');
  console.log(`📦 Sirviendo cliente estático desde ${clientDist}`);
} else {
  console.log('⚡ Modo desarrollo: no se encontró client/dist');
}

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📋 API: http://localhost:${PORT}/api`);
  });
});

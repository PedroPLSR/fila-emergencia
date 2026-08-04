import express from 'express';
import { errorHandler } from './middleware/errors.js';
import examesRouter from './routes/exames.js';
import atendimentosRouter from './routes/atendimentos.js';
import filasRouter from './routes/filas.js';
import diaRouter from './routes/dia.js';
import logsRouter from './routes/logs.js';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/exames', examesRouter);
app.use('/api/atendimentos', atendimentosRouter);
app.use('/api/filas', filasRouter);
app.use('/api/dia', diaRouter);
app.use('/api/logs', logsRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

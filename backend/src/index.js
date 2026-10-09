const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database/db');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Endpoint de Healthcheck para o Nginx e monitoramento
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Clinica Estefana API',
    time: new Date().toISOString()
  });
});

// Registra as rotas da aplicação
app.use('/api', routes);

app.listen(port, async () => {
  console.log(`Servidor rodando na porta ${port}`);
  await initDatabase();
});

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_padrao_clinica_estefana';

// Middleware de Autenticação JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

// -----------------------------------------------------------------------------
// 1. ROTAS DE AUTENTICAÇÃO
// -----------------------------------------------------------------------------

// Login do Painel Administrativo (Nutricionistas/Médicos)
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, type: 'staff' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login do Paciente (Aplicativo Web / Mobile)
router.post('/auth/patient-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM patients WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais de paciente inválidas' });
    }

    const patient = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, patient.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais de paciente inválidas' });
    }

    const token = jwt.sign({ id: patient.id, type: 'patient' }, JWT_SECRET, { expiresIn: '15d' });
    res.json({ token, patient: { id: patient.id, name: patient.name, email: patient.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 2. ROTAS DE PACIENTES
// -----------------------------------------------------------------------------
router.get('/patients', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, phone, cpf, birth_date, created_at FROM patients ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/patients', authMiddleware, async (req, res) => {
  const { name, email, phone, cpf, birthDate, password } = req.body;
  try {
    const defaultPassword = password || 'mudar123';
    const hash = await bcrypt.hash(defaultPassword, 10);
    
    const result = await db.query(
      `INSERT INTO patients (name, email, phone, cpf, birth_date, password_hash, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, cpf, birth_date`,
      [name, email, phone, cpf, birthDate || null, hash, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 3. ROTAS DE AGENDAMENTOS
// -----------------------------------------------------------------------------
router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    const query = req.user.type === 'patient'
      ? `SELECT a.*, u.name as doctor_name FROM appointments a
         JOIN users u ON a.doctor_id = u.id
         WHERE a.patient_id = $1 ORDER BY a.scheduled_at DESC`
      : `SELECT a.*, p.name as patient_name FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         ORDER BY a.scheduled_at DESC`;

    const params = req.user.type === 'patient' ? [req.user.id] : [];
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments', authMiddleware, async (req, res) => {
  const { patientId, scheduledAt, notes } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [patientId, req.user.id, scheduledAt, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// 4. ROTAS DE DIETAS / PLANOS ALIMENTARES
// -----------------------------------------------------------------------------
router.get('/diets/my-plan', authMiddleware, async (req, res) => {
  try {
    const patientId = req.user.type === 'patient' ? req.user.id : req.query.patientId;
    const result = await db.query(
      'SELECT * FROM diet_plans WHERE patient_id = $1 AND active = TRUE ORDER BY created_at DESC LIMIT 1',
      [patientId]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/diets', authMiddleware, async (req, res) => {
  const { patientId, title, description, meals } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO diet_plans (patient_id, doctor_id, title, description, meals)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [patientId, req.user.id, title, description, JSON.stringify(meals || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

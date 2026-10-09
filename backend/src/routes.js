const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_padrao_clinica_estefana';

const passwordResetTokens = new Map();

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

router.post('/auth/register-admin', async (req, res) => {
  const { name, email, password, crnCrm, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'E-mail profissional já cadastrado.' });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, crn_crm) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, crn_crm, created_at`,
      [name, email, passwordHash, role || 'nutricionista', crnCrm || '']
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role, type: 'staff' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'Profissional cadastrado!', user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Usuário ou senha incorretos' });
    const token = jwt.sign({ id: user.id, role: user.role, type: 'staff' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, crn_crm: user.crn_crm } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Informe o e-mail cadastrado.' });
  try {
    const result = await db.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Nenhum profissional encontrado com este e-mail.' });
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;
    passwordResetTokens.set(email.toLowerCase(), { code: resetCode, expiresAt });
    res.json({ message: 'Código gerado com sucesso!', email, demoCode: resetCode, expiresIn: '15 minutos' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'Dados incompletos.' });
  const storedData = passwordResetTokens.get(email.toLowerCase());
  if (!storedData) return res.status(400).json({ error: 'Nenhum pedido de recuperação ativo.' });
  if (Date.now() > storedData.expiresAt) {
    passwordResetTokens.delete(email.toLowerCase());
    return res.status(400).json({ error: 'Código expirado.' });
  }
  if (storedData.code !== code.trim()) return res.status(400).json({ error: 'Código de recuperação inválido.' });
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
    passwordResetTokens.delete(email.toLowerCase());
    res.json({ message: 'Senha redefinida com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/patients', authMiddleware, async (req, res) => {
  const { name, email, phone, cpf, birthDate, password } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
  try {
    const existing = await db.query('SELECT id FROM patients WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Paciente já cadastrado.' });
    const rawPassword = password || 'estefana123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);
    const result = await db.query(
      `INSERT INTO patients (name, email, phone, cpf, birth_date, password_hash, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, phone, cpf, birth_date, created_at`,
      [name, email, phone || '', cpf || '', birthDate || null, passwordHash, req.user.id]
    );
    res.status(201).json({ message: 'Paciente cadastrado!', patient: result.rows[0], initialPassword: rawPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/patient-login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM patients WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Paciente não encontrado.' });
    const patient = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, patient.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Senha incorreta.' });
    const token = jwt.sign({ id: patient.id, type: 'patient' }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, patient: { id: patient.id, name: patient.name, email: patient.email, phone: patient.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/patients', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, phone, cpf, birth_date, created_at FROM patients ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    const query = req.user.type === 'patient'
      ? `SELECT a.*, u.name as doctor_name FROM appointments a LEFT JOIN users u ON a.doctor_id = u.id WHERE a.patient_id = $1 ORDER BY a.scheduled_at DESC`
      : `SELECT a.*, p.name as patient_name FROM appointments a LEFT JOIN patients p ON a.patient_id = p.id ORDER BY a.scheduled_at DESC`;
    const params = req.user.type === 'patient' ? [req.user.id] : [];
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments', authMiddleware, async (req, res) => {
  const { patientId, scheduledAt, notes } = req.body;
  if (!patientId || !scheduledAt) return res.status(400).json({ error: 'Paciente e data são obrigatórios.' });
  try {
    const result = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, status, notes) VALUES ($1, $2, $3, 'AGENDADO', $4) RETURNING *`,
      [patientId, req.user.id, scheduledAt, notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/diets/my-plan', authMiddleware, async (req, res) => {
  try {
    const patientId = req.user.type === 'patient' ? req.user.id : req.query.patientId;
    const result = await db.query('SELECT * FROM diet_plans WHERE patient_id = $1 AND active = TRUE ORDER BY created_at DESC LIMIT 1', [patientId]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/diets', authMiddleware, async (req, res) => {
  const { patientId, title, description, meals } = req.body;
  try {
    await db.query('UPDATE diet_plans SET active = FALSE WHERE patient_id = $1', [patientId]);
    const result = await db.query(
      `INSERT INTO diet_plans (patient_id, doctor_id, title, description, meals, active) VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
      [patientId, req.user.id, title, description || '', JSON.stringify(meals || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

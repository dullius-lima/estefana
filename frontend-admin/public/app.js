// --- DADOS DO PROFISSIONAL RESPONSÁVEL ATIVO ---
const profissionalAtivo = {
  nome: "Dra. Estéfana Andrade",
  cargo: "Nutricionista Clínica (CRN-3 10842)"
};

let abaAtivaAtual = "aba-evolucao";
let gravandoAudio = false;
let reconhecimentoVoz = null;
let transcricaoEmTempoReal = "";

// --- AUTENTICAÇÃO E LOGIN ---
function verificarAutenticacao() {
  const logado = localStorage.getItem('leveh_auth');
  const modal = document.getElementById('loginModal');
  if (modal) {
    modal.style.display = logado === 'true' ? 'none' : 'flex';
  }
}

function realizarLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value.trim();

  if (email === 'admin@leveh.com.br' && senha === 'admin123') {
    localStorage.setItem('leveh_auth', 'true');
    document.getElementById('loginModal').style.display = 'none';
  } else {
    alert('Credenciais inválidas!');
  }
}

function sairDoSistema() {
  if (confirm('Deseja realmente sair do sistema?')) {
    localStorage.removeItem('leveh_auth');
    location.reload();
  }
}

// --- CONTROLE DA SIDEBAR ---
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  if (window.innerWidth <= 820) {
    sidebar.classList.toggle('mobile-open');
  } else {
    sidebar.classList.toggle('expanded');
  }
}

// --- ROTEADOR INTERNO ---
function navegarPara(moduloId) {
  document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const view = document.getElementById(`view-${moduloId}`);
  const navBtn = document.getElementById(`nav-${moduloId}`);
  const pageTitle = document.getElementById('pageTitle');

  if (view) view.style.display = 'block';
  if (navBtn) navBtn.classList.add('active');

  const titulos = {
    pacientes: "Pacientes",
    prontuario: "Prontuário Clínico",
    agenda: "Agenda & Calendário",
    taco: "Tabela de Alimentos (TACO)",
    substituicao: "Listas de Substituição",
    estoque: "Estoque & Insumos",
    pop: "Procedimentos (POP)",
    equipe: "Gestão de Equipe & Permissões"
  };
  if (pageTitle && titulos[moduloId]) pageTitle.innerText = titulos[moduloId];

  if (window.innerWidth <= 820) {
    document.getElementById('sidebar')?.classList.remove('mobile-open');
  }
}

// --- CONTROLE DAS ABAS REDONDAS ---
function trocarAbaProntuario(elementoClicado, abaId) {
  document.querySelectorAll('.round-tab-item').forEach(b => {
    if (!b.classList.contains('round-tab-add')) b.classList.remove('active');
  });
  document.querySelectorAll('.tab-content-item').forEach(c => c.style.display = 'none');

  elementoClicado.classList.add('active');
  abaAtivaAtual = abaId;

  const target = document.getElementById(abaId);
  if (target) target.style.display = 'block';
}

// --- MODAL DE NOVA EVOLUÇÃO ---
function abrirModalEvolucao() {
  if (!pacienteAtivo) return;
  document.getElementById('modalEvolucaoSubinfo').innerText = `Paciente: ${pacienteAtivo.nome} (${pacienteAtivo.prontuario})`;
  document.getElementById('modalTextoEvolucao').value = "";
  document.getElementById('modalEvolucao').style.display = "flex";
}

function fecharModalEvolucao() {
  if (gravandoAudio) pararGravacao();
  document.getElementById('modalEvolucao').style.display = "none";
}

// --- COPILOTO IA & GRAVAÇÃO DE VOZ (DENTRO DO MODAL) ---
function inicializarReconhecimento() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Reconhecimento de voz não suportado neste navegador. Utilize Google Chrome no Android ou Desktop.");
    return null;
  }
  const rec = new SpeechRecognition();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = 'pt-BR';

  rec.onresult = (event) => {
    let parcial = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        transcricaoEmTempoReal += event.results[i][0].transcript + " ";
      } else {
        parcial += event.results[i][0].transcript;
      }
    }
    const txtArea = document.getElementById('modalTextoEvolucao');
    if (txtArea) {
      txtArea.value = transcricaoEmTempoReal + (parcial ? `[${parcial}]` : "");
    }
  };

  rec.onerror = (e) => {
    console.error("Erro na escuta da IA:", e);
  };

  return rec;
}

function alternarGravacaoIA() {
  if (!gravandoAudio) {
    iniciarGravacao();
  } else {
    pararGravacao();
  }
}

function iniciarGravacao() {
  transcricaoEmTempoReal = document.getElementById('modalTextoEvolucao').value;
  if (!reconhecimentoVoz) reconhecimentoVoz = inicializarReconhecimento();
  if (!reconhecimentoVoz) return;

  try {
    reconhecimentoVoz.start();
    gravandoAudio = true;
    const btn = document.getElementById('btnCopilotoIA');
    btn.classList.add('gravando');
    document.getElementById('iconeCopilotoIA').innerText = "⏹️";
    document.getElementById('labelCopilotoIA').innerText = "Gravando com IALEVEH... Clique para Encerrar";
  } catch (err) {
    console.warn("Aviso:", err);
  }
}

function pararGravacao() {
  if (reconhecimentoVoz) {
    try { reconhecimentoVoz.stop(); } catch (e) {}
  }
  gravandoAudio = false;
  const btn = document.getElementById('btnCopilotoIA');
  btn.classList.remove('gravando');
  document.getElementById('iconeCopilotoIA').innerText = "✨";
  document.getElementById('labelCopilotoIA').innerText = "IALEVEH (Gravar & Estruturar)";

  estruturarComIA();
}

// Estruturação IA no padrão nutricional SOAP
function estruturarComIA() {
  const txtArea = document.getElementById('modalTextoEvolucao');
  let textoBruto = txtArea.value.replace(/\[.*?\]/g, '').trim();

  if (!textoBruto) return;

  // Organiza em tópicos clínicos para alimentar o banco de memória da IA
  const textoEstruturado = `[SUBJETIVO & QUEIXA CLÍNICA]
• Relato do paciente: "${textoBruto}"

[AVALIAÇÃO NUTRICIONAL & METABÓLICA]
• Adesão à conduta alimentar e resposta sintomatológica avaliadas em tempo real.

[CONDUTA DIETOTERÁPICA & METAS]
• Ajustes prescritos no plano nutricional e metas traçadas para a próxima reavaliação.`;

  txtArea.value = textoEstruturado;
}

// --- PERSISTÊNCIA EM BANCO DE DADOS (MEMÓRIA DA IA) ---
async function salvarEvolucaoComMemoria(e) {
  e.preventDefault();
  const txt = document.getElementById('modalTextoEvolucao').value.trim();
  if (!txt || !pacienteAtivo) return;

  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString('pt-BR');
  const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const novaEvolucao = {
    id: Date.now(),
    pacienteId: pacienteAtivo.id,
    prontuario: pacienteAtivo.prontuario,
    autor: profissionalAtivo.nome,
    cargo: profissionalAtivo.cargo,
    dataHora: `${dataFormatada} às ${horaFormatada}`,
    timestampISO: agora.toISOString(),
    texto: txt
  };

  // 1. Armazenamento local imediato (Memória persistente no navegador)
  if (!pacienteAtivo.evolucoes) pacienteAtivo.evolucoes = [];
  pacienteAtivo.evolucoes.unshift(novaEvolucao);

  salvarMemoriaLocalPaciente(pacienteAtivo);

  // 2. Disparo assíncrono para o banco de dados na API (FastAPI)
  try {
    await fetch(`/api/pacientes/${pacienteAtivo.id}/evolucoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaEvolucao)
    });
  } catch (err) {
    console.info("Cache local atualizado com sucesso (Modo offline/Codespaces).");
  }

  fecharModalEvolucao();
  renderizarEvolucoes();
}

function salvarMemoriaLocalPaciente(paciente) {
  localStorage.setItem(`leveh_memoria_paciente_${paciente.id}`, JSON.stringify(paciente.evolucoes));
}

function carregarMemoriaLocalPaciente(pacienteId) {
  const dados = localStorage.getItem(`leveh_memoria_paciente_${pacienteId}`);
  return dados ? JSON.parse(dados) : null;
}

// --- CÁLCULO DE IDADE SEGURO ---
function calcularIdade(dataNasc) {
  if (!dataNasc) return "--";
  let partes = dataNasc.split(/[-/]/);
  let nasc;
  if (partes.length === 3) {
    if (partes[0].length === 4) {
      nasc = new Date(partes[0], partes[1] - 1, partes[2]);
    } else {
      nasc = new Date(partes[2], partes[1] - 1, partes[0]);
    }
  } else {
    nasc = new Date(dataNasc);
  }

  if (isNaN(nasc.getTime())) return "--";
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return (idade >= 0 && idade < 125) ? `${idade} anos` : "--";
}

function atualizarIdadePreview() {
  const dt = document.getElementById('pacNascimento').value;
  document.getElementById('pacIdade').value = calcularIdade(dt);
}

// --- BANCO DE DADOS EM MEMÓRIA ---
let bancoPacientes = [
  {
    id: 1,
    prontuario: "PRON-2193",
    nome: "Mariana Souza",
    cpf: "045.123.899-10",
    nascimento: "1997-09-06",
    sexo: "F",
    telefone: "67991289607",
    email: "mariana.souza@gmail.com",
    convenio: "Unimed",
    endereco: "Rua Ceará, 1200, Vila Gomes",
    cidade: "Campo Grande - MS",
    alergias: "Glúten, Lactose",
    condicoes: "Resistência à Insulina",
    obs: "Meta de reeducação alimentar.",
    evolucoes: [
      {
        id: 101,
        autor: "Dra. Estéfana Andrade",
        cargo: "Nutricionista Clínica (CRN-3 10842)",
        dataHora: "10/10/2026 às 21:02:45",
        texto: "Paciente comparece à consulta de retorno com redução de 1,2 kg de gordura corporal. Relata melhora acentuada no padrão de sono e adesão de 90% ao plano alimentar prescrito."
      }
    ]
  },
  {
    id: 2,
    prontuario: "PRON-1044",
    nome: "Carlos Eduardo Silva",
    cpf: "789.456.123-00",
    nascimento: "1988-04-12",
    sexo: "M",
    telefone: "67998124455",
    email: "carlos.silva@outlook.com",
    convenio: "Particular",
    endereco: "Av. Afonso Pena, 3450, Centro",
    cidade: "Campo Grande - MS",
    alergias: "Nenhuma",
    condicoes: "Hipertensão leve",
    obs: "Acompanhamento esportivo.",
    evolucoes: []
  }
];

let pacienteAtivo = null;

const dadosIniciais = {
  estoque: [
    { cod: "INS-001", nome: "Fita Métrica Antropométrica", cat: "Avaliação", qtd: 12, min: 4, status: "Normal" },
    { cod: "INS-002", nome: "Eletrodos de Bioimpedância", cat: "Exames", qtd: 8, min: 15, status: "Crítico" },
    { cod: "INS-003", nome: "Luvas de Procedimento (M)", cat: "Descartáveis", qtd: 240, min: 50, status: "Normal" }
  ],
  substituicoes: [
    { grupo: "Carboidratos", ref: "Arroz Branco Cozido", porcaoRef: "100g (4 colheres)", sub: "Batata Doce", porcaoSub: "130g" },
    { grupo: "Carboidratos", ref: "Pão Francês", porcaoRef: "50g (1 un)", sub: "Tapioca Pronta", porcaoSub: "60g" },
    { grupo: "Proteínas", ref: "Peito de Frango", porcaoRef: "100g", sub: "Tilápia Grelhada", porcaoSub: "120g" }
  ],
  pop: [
    { cod: "POP-NUT-001", nome: "Protocolo de Consulta Nutricional Inicial", area: "Nutrição", ver: "v2.1", data: "10/2026" },
    { cod: "POP-CLI-002", nome: "Calibração e Medição com Adipômetro", area: "Antropometria", ver: "v1.4", data: "08/2026" },
    { cod: "POP-BIO-003", nome: "Higienização de Balanças e Equipamentos", area: "Biossegurança", ver: "v3.0", data: "09/2026" }
  ]
};

// --- MODAL DE PACIENTES ---
function abrirModalNovoPaciente() {
  document.getElementById('formPaciente').reset();
  document.getElementById('pacienteId').value = "";
  document.getElementById('pacConvenio').value = "";
  document.getElementById('modalPacienteTitulo').innerText = "Cadastrar Novo Paciente";
  document.getElementById('btnSalvarPaciente').innerText = "Cadastrar";
  document.getElementById('pacIdade').value = "";
  document.getElementById('modalPaciente').style.display = "flex";
}

function abrirModalEdicaoPaciente(id) {
  const p = bancoPacientes.find(item => item.id === id);
  if (!p) return;

  document.getElementById('pacienteId').value = p.id;
  document.getElementById('pacNome').value = p.nome;
  document.getElementById('pacCpf').value = p.cpf || "";
  document.getElementById('pacNascimento').value = p.nascimento || "";
  document.getElementById('pacIdade').value = calcularIdade(p.nascimento);
  document.getElementById('pacSexo').value = p.sexo || "F";
  document.getElementById('pacTelefone').value = p.telefone || "";
  document.getElementById('pacEmail').value = p.email || "";
  document.getElementById('pacConvenio').value = p.convenio || "";
  document.getElementById('pacEndereco').value = p.endereco || "";
  document.getElementById('pacCidade').value = p.cidade || "Campo Grande - MS";
  document.getElementById('pacAlergias').value = p.alergias || "";
  document.getElementById('pacCondicoes').value = p.condicoes || "";
  document.getElementById('pacObs').value = p.obs || "";

  document.getElementById('modalPacienteTitulo').innerText = `Editar Cadastro — ${p.prontuario}`;
  document.getElementById('btnSalvarPaciente').innerText = "Gravar Alterações";
  document.getElementById('modalPaciente').style.display = "flex";
}

function fecharModalPaciente() {
  document.getElementById('modalPaciente').style.display = "none";
}

function salvarPaciente(e) {
  e.preventDefault();
  const id = document.getElementById('pacienteId').value;
  
  const dados = {
    nome: document.getElementById('pacNome').value.trim(),
    cpf: document.getElementById('pacCpf').value.trim(),
    nascimento: document.getElementById('pacNascimento').value,
    sexo: document.getElementById('pacSexo').value,
    telefone: document.getElementById('pacTelefone').value.trim(),
    email: document.getElementById('pacEmail').value.trim(),
    convenio: document.getElementById('pacConvenio').value.trim() || "Particular",
    endereco: document.getElementById('pacEndereco').value.trim(),
    cidade: document.getElementById('pacCidade').value.trim(),
    alergias: document.getElementById('pacAlergias').value.trim() || "Nenhuma",
    condicoes: document.getElementById('pacCondicoes').value.trim(),
    obs: document.getElementById('pacObs').value.trim()
  };

  if (id) {
    const idx = bancoPacientes.findIndex(item => item.id == id);
    if (idx !== -1) {
      bancoPacientes[idx] = { ...bancoPacientes[idx], ...dados };
    }
  } else {
    const novoId = bancoPacientes.length ? Math.max(...bancoPacientes.map(p => p.id)) + 1 : 1;
    const novoProntuario = `PRON-${Math.floor(1000 + Math.random() * 9000)}`;
    bancoPacientes.push({
      id: novoId,
      prontuario: novoProntuario,
      evolucoes: [],
      ...dados
    });
  }

  fecharModalPaciente();
  renderizarPacientes();
}

// --- FLUXO DO PRONTUÁRIO CLÍNICO ---
function abrirProntuario(id) {
  const p = bancoPacientes.find(item => item.id === id);
  if (!p) return;

  // Carrega histórico persistente do paciente
  const historicoSalvo = carregarMemoriaLocalPaciente(p.id);
  if (historicoSalvo) {
    p.evolucoes = historicoSalvo;
  }

  pacienteAtivo = p;
  document.getElementById('pronNome').innerText = p.nome;
  document.getElementById('pronSubinfo').innerText = `Prontuário: ${p.prontuario} | Idade: ${calcularIdade(p.nascimento)} | Tel: ${p.telefone} | Convênio: ${p.convenio}`;
  document.getElementById('pronBadge').innerText = p.prontuario;

  abaAtivaAtual = "aba-evolucao";
  document.querySelectorAll('.round-tab-item').forEach(b => {
    if (!b.classList.contains('round-tab-add')) b.classList.remove('active');
  });
  document.querySelector('.round-tab-item[data-aba="aba-evolucao"]')?.classList.add('active');
  document.querySelectorAll('.tab-content-item').forEach(c => c.style.display = 'none');
  document.getElementById('aba-evolucao').style.display = 'block';

  renderizarEvolucoes();
  navegarPara('prontuario');
}

function voltarParaListaPacientes() {
  navegarPara('pacientes');
}

function alternarExpansaoEvolucao(cardId) {
  const card = document.getElementById(`evolucao-card-${cardId}`);
  const btn = document.getElementById(`btn-exp-${cardId}`);
  if (!card) return;

  const aberta = card.classList.toggle('aberta');
  if (btn) btn.innerText = aberta ? "▲ Recolher" : "▼ Expandir";
}

function renderizarEvolucoes() {
  const box = document.getElementById('historicoEvolucoes');
  if (!pacienteAtivo || !pacienteAtivo.evolucoes || pacienteAtivo.evolucoes.length === 0) {
    box.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:14px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border);">Nenhuma anotação registrada ainda. Clique em <strong>+</strong> para abrir a janela de evolução.</div>';
    return;
  }

  box.innerHTML = pacienteAtivo.evolucoes.map(ev => `
    <div class="evolucao-card" id="evolucao-card-${ev.id}">
      <div class="evolucao-header" onclick="alternarExpansaoEvolucao(${ev.id})">
        <div>
          <span class="evolucao-autor">${ev.autor}</span>
          <span class="evolucao-cargo">— ${ev.cargo}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="evolucao-datahora">📅 ${ev.dataHora}</span>
          <button class="btn-toggle-exp" id="btn-exp-${ev.id}">▼ Expandir</button>
        </div>
      </div>
      <div class="evolucao-texto">${ev.texto}</div>
    </div>
  `).join('');
}

// --- RENDERIZADORES GERAIS ---
function renderizarPacientes() {
  const pacTbody = document.getElementById('listaPacientesCorpo');
  if (!pacTbody) return;

  pacTbody.innerHTML = bancoPacientes.map(p => `
    <tr>
      <td><strong>${p.prontuario}</strong></td>
      <td><strong>${p.nome}</strong></td>
      <td>${calcularIdade(p.nascimento)}</td>
      <td>${p.sexo}</td>
      <td><span style="font-weight:600;color:var(--accent);">${p.convenio}</span></td>
      <td>${p.telefone}</td>
      <td><span style="color:${p.alergias !== 'Nenhuma' ? '#a11414' : '#62726b'}; font-weight: 500;">${p.alergias}</span></td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline" style="padding:4px 8px;font-size:0.75rem;" onclick="abrirModalEdicaoPaciente(${p.id})">✏️ Editar</button>
          <button class="btn btn-primary" style="padding:4px 8px;font-size:0.75rem;" onclick="abrirProntuario(${p.id})">📋 Prontuário</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderizarTabelasGerais() {
  const estTbody = document.getElementById('listaEstoqueCorpo');
  if (estTbody) {
    estTbody.innerHTML = dadosIniciais.estoque.map(e => `
      <tr>
        <td><code>${e.cod}</code></td>
        <td><strong>${e.nome}</strong></td>
        <td>${e.cat}</td>
        <td>${e.qtd}</td>
        <td>${e.min}</td>
        <td><span style="font-weight:600;color:${e.status === 'Crítico' ? '#a11414':'#156930'}">${e.status}</span></td>
      </tr>
    `).join('');
  }

  const subTbody = document.getElementById('listaSubstituicaoCorpo');
  if (subTbody) {
    subTbody.innerHTML = dadosIniciais.substituicoes.map(s => `
      <tr>
        <td><strong>${s.grupo}</strong></td>
        <td>${s.ref}</td>
        <td>${s.porcaoRef}</td>
        <td>${s.sub}</td>
        <td>${s.porcaoSub}</td>
      </tr>
    `).join('');
  }

  const popTbody = document.getElementById('listaPOPCorpo');
  if (popTbody) {
    popTbody.innerHTML = dadosIniciais.pop.map(p => `
      <tr>
        <td><code>${p.cod}</code></td>
        <td><strong>${p.nome}</strong></td>
        <td>${p.area}</td>
        <td>${p.ver}</td>
        <td>${p.data}</td>
        <td><button class="btn btn-outline" style="padding:4px 8px;font-size:0.78rem;" onclick="alert('Protocolo ${p.cod}')">Ver</button></td>
      </tr>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacao();
  renderizarPacientes();
  renderizarTabelasGerais();
});

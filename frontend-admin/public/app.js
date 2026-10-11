// --- BANCO DE USUÁRIOS (APENAS O ADM COMO PADRÃO) ---
var usuariosSistema = [
  {
    id: 1,
    nome: "Administrador Geral",
    email: "admin@leveh.com.br",
    senha: "admin123",
    perfil: "Administrador",
    registro: "ADM-01",
    status: "Ativo"
  }
];

// Carrega usuários criados pelo Administrador que foram persistidos
try {
  var dadosPersistidos = localStorage.getItem('leveh_usuarios_bd_v2');
  if (dadosPersistidos) {
    usuariosSistema = JSON.parse(dadosPersistidos);
  }
} catch (e) {}

function salvarUsuariosNoStorage() {
  localStorage.setItem('leveh_usuarios_bd_v2', JSON.stringify(usuariosSistema));
}

// Descrições hospitalares pré-programadas
var descricoesHospitalares = {
  "Medico": "Emissão de prescrições médicas (CRM), solicitações de exames, checagem e evoluções clínicas completas.",
  "Enfermeiro": "Checagem de prescrições (COREN), administração de medicamentos, realização de procedimentos e baixa de estoque.",
  "TecnicoEnfermagem": "Execução de procedimentos de enfermagem, checagem sob supervisão e baixa de materiais.",
  "Farmaceutico": "Controle e dispensação de estoque clínico, rastreabilidade de lotes, validades e auditoria técnica.",
  "Nutricionista": "Avaliações antropométricas, bioimpedância, prescrições dietéticas (TACO) e condutas alimentares.",
  "Fisioterapeuta": "Evoluções respiratórias e motoras, registro de condutas e procedimentos ventilatórios.",
  "Recepcao": "Atendimento, admissão, cadastro de pacientes e gestão da agenda.",
  "Administrador": "Acesso mestre e irrestrito a todos os módulos, relatórios e gestão de funcionários."
};

function aoMudarFuncaoHospitalar() {
  var sel = document.getElementById('colabPerfil');
  var info = document.getElementById('infoEscopoFuncao');
  if (sel && info) {
    var desc = descricoesHospitalares[sel.value] || "Acesso aos recursos clínicos.";
    info.innerHTML = "<strong>Escopo da Função:</strong> " + desc;
  }
}

// Sessão ativa
var usuarioLogado = usuariosSistema[0];
var abaAtivaAtual = "aba-evolucao";
var gravandoAudio = false;
var reconhecimentoVoz = null;
var transcricaoEmTempoReal = "";

// --- ESTOQUE CENTRALIZADO COM RASTREABILIDADE SANITÁRIA ---
var estoqueInsumos = [
  {
    cod: "INS-001",
    nome: "Dipirona Monoidratada 500mg/ml",
    principio: "Dipirona Sódica",
    registroSanitario: "1.0043.0123.001-2",
    lote: "LOT-2026-DIP01",
    validade: "2027-08-30",
    fabricacao: "2025-08-01",
    fabricante: "Eurofarma Laboratórios",
    cat: "Medicamentos",
    armazenamento: "Ambiente (15°C a 30°C)",
    qtd: 120,
    min: 25,
    unidade: "Ampola"
  },
  {
    cod: "INS-002",
    nome: "Ondansetrona Cloridrato 2mg/ml",
    principio: "Cloridrato de Ondansetrona",
    registroSanitario: "1.0235.0345.002-8",
    lote: "LOT-2026-OND88",
    validade: "2027-05-15",
    fabricacao: "2025-05-10",
    fabricante: "EMS S/A",
    cat: "Medicamentos",
    armazenamento: "Ambiente (15°C a 30°C)",
    qtd: 80,
    min: 20,
    unidade: "Ampola"
  },
  {
    cod: "INS-003",
    nome: "Solução Fisiológica NaCl 0,9% 500ml",
    principio: "Cloreto de Sódio 0,9%",
    registroSanitario: "1.0491.0012.003-4",
    lote: "LOT-2026-SOL102",
    validade: "2027-11-20",
    fabricacao: "2025-11-01",
    fabricante: "Fresenius Kabi",
    cat: "Soluções Parenterais",
    armazenamento: "Ambiente (15°C a 30°C)",
    qtd: 40,
    min: 15,
    unidade: "Bolsa"
  },
  {
    cod: "INS-004",
    nome: "Seringa Hipodérmica Descartável 5ml c/ Agulha",
    principio: "Polipropileno Estéril apirogênico",
    registroSanitario: "8.0123.4567.001-0",
    lote: "LOT-2026-SER5M",
    validade: "2029-01-30",
    fabricacao: "2024-01-15",
    fabricante: "BD Medical Devices",
    cat: "Descartáveis / Correlatos",
    armazenamento: "Local Seco e Arejado",
    qtd: 200,
    min: 40,
    unidade: "Unidade"
  },
  {
    cod: "INS-005",
    nome: "Cateter Intravenoso Periférico 20G",
    principio: "Teflon radiopaco c/ filtro bacteriológico",
    registroSanitario: "8.0456.7890.002-1",
    lote: "LOT-2026-CAT20",
    validade: "2028-09-10",
    fabricacao: "2024-09-01",
    fabricante: "Nipro Medical",
    cat: "Dispositivos / Acessos",
    armazenamento: "Local Seco e Arejado",
    qtd: 60,
    min: 15,
    unidade: "Unidade"
  },
  {
    cod: "INS-006",
    nome: "Equipo Macrogotas para Infusão Gravitacional",
    principio: "PVC atóxico com filtro hidrofóbico",
    registroSanitario: "8.0012.9876.001-5",
    lote: "LOT-2026-EQM50",
    validade: "2028-12-15",
    fabricacao: "2024-12-01",
    fabricante: "B. Braun",
    cat: "Dispositivos / Acessos",
    armazenamento: "Local Seco e Arejado",
    qtd: 50,
    min: 15,
    unidade: "Unidade"
  },
  {
    cod: "INS-007",
    nome: "Swab Algodão c/ Álcool Isopropílico 70%",
    principio: "Álcool 70% estéril",
    registroSanitario: "3.0111.0022.001-9",
    lote: "LOT-2026-ALC300",
    validade: "2027-04-10",
    fabricacao: "2025-04-01",
    fabricante: "Descarpack",
    cat: "Saneantes / Antissépticos",
    armazenamento: "Ambiente (15°C a 30°C)",
    qtd: 300,
    min: 50,
    unidade: "Pacote"
  }
];

// --- BANCO DE PACIENTES ---
var bancoPacientes = [
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
        autor: "Administrador Geral",
        cargo: "Diretoria Clínica",
        dataHora: "10/10/2026, 22:51:38",
        texto: "Paciente comparece para retorno clínico com boa evolução."
      }
    ],
    prescricoesMedicas: [
      {
        id: 201,
        autor: "Dr. Responsável",
        cargo: "Médico Assistencial (CRM)",
        dataHora: "10/10/2026, 23:05:00",
        obsGerais: "Administrar em caso de dor ou náuseas.",
        itens: [
          {
            id: 1,
            codEstoque: "INS-001",
            medicamento: "Dipirona Monoidratada 500mg/ml",
            dose: "1 ampola (1000mg)",
            via: "EV",
            posologia: "Agora (se dor)",
            checado: false,
            checadoPor: "",
            checadoEm: "",
            insumosGastosConfirmados: []
          }
        ]
      }
    ],
    procedimentos: []
  }
];

var pacienteAtivo = null;

// --- IDADE SEGURO ---
function calcularIdade(dataNasc) {
  if (!dataNasc) return "--";
  var partes = dataNasc.split(/[-/]/);
  var nasc;
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
  var hoje = new Date();
  var idade = hoje.getFullYear() - nasc.getFullYear();
  var m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return (idade >= 0 && idade < 125) ? (idade + " anos") : "--";
}

function atualizarIdadePreview() {
  var dt = document.getElementById('pacNascimento');
  var out = document.getElementById('pacIdade');
  if (dt && out) out.value = calcularIdade(dt.value);
}

// --- AUTENTICAÇÃO LIMPA ---
function verificarAutenticacao() {
  var emailLogado = localStorage.getItem('leveh_email_sessao');
  var modal = document.getElementById('loginModal');

  if (emailLogado) {
    var usr = usuariosSistema.find(function(u) { return u.email === emailLogado; });
    if (usr && usr.status === "Ativo") {
      usuarioLogado = usr;
      if (modal) modal.style.display = 'none';
      atualizarBadgePerfil();
      return;
    }
  }

  if (modal) modal.style.display = 'flex';
  atualizarBadgePerfil();
}

function realizarLogin(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  var emailInput = document.getElementById('loginEmail');
  var senhaInput = document.getElementById('loginSenha');
  var fb = document.getElementById('loginFeedback');
  if (fb) fb.style.display = 'none';

  var email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  var senha = senhaInput ? senhaInput.value.trim() : '';

  var user = usuariosSistema.find(function(u) { return u.email.toLowerCase() === email; });

  if (!user) {
    if (fb) {
      fb.innerText = "E-mail ou credenciais não encontrados.";
      fb.style.display = 'block';
    }
    return false;
  }

  if (user.status === "Inativo") {
    if (fb) {
      fb.innerText = "Esta conta de colaborador está inativa.";
      fb.style.display = 'block';
    }
    return false;
  }

  if (user.senha === senha) {
    usuarioLogado = user;
    localStorage.setItem('leveh_email_sessao', user.email);

    var modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';

    atualizarBadgePerfil();
    renderizarPacientes();
    renderizarEstoque();
    renderizarEquipe();
  } else {
    if (fb) {
      fb.innerText = "Senha incorreta. Tente novamente.";
      fb.style.display = 'block';
    }
  }

  return false;
}

function sairDoSistema() {
  localStorage.removeItem('leveh_email_sessao');
  var modal = document.getElementById('loginModal');
  if (modal) modal.style.display = 'flex';
}

function atualizarBadgePerfil() {
  var b = document.getElementById('badgePerfilAtivo');
  if (b) b.innerText = usuarioLogado.nome + " — " + usuarioLogado.perfil + " (" + usuarioLogado.registro + ")";

  // Restrição do botão de prescrição no prontuário
  var btnPrescr = document.getElementById('btnAbrirPrescricao');
  if (btnPrescr) {
    btnPrescr.style.display = (usuarioLogado.perfil === 'Medico' || usuarioLogado.perfil === 'Administrador') ? 'inline-flex' : 'none';
  }

  // Visibilidade do botão de cadastrar novos funcionários (Apenas Administrador)
  var btnNovoColab = document.getElementById('btnNovoColaborador');
  if (btnNovoColab) {
    btnNovoColab.style.display = (usuarioLogado.perfil === 'Administrador') ? 'inline-flex' : 'none';
  }
}

// --- MODAL DE TROCAR A PRÓPRIA SENHA ---
function abrirModalTrocarMinhaSenha() {
  document.getElementById('senhaAtualUser').value = "";
  document.getElementById('novaSenhaUser').value = "";
  document.getElementById('modalTrocarMinhaSenha').style.display = 'flex';
}

function fecharModalTrocarMinhaSenha() {
  document.getElementById('modalTrocarMinhaSenha').style.display = 'none';
}

function salvarMinhaSenha(e) {
  if (e) e.preventDefault();
  var atual = document.getElementById('senhaAtualUser').value.trim();
  var nova = document.getElementById('novaSenhaUser').value.trim();

  if (atual !== usuarioLogado.senha) {
    alert("A senha atual informada está incorreta.");
    return;
  }

  if (!nova || nova.length < 3) {
    alert("A nova senha deve possuir ao menos 3 caracteres.");
    return;
  }

  usuarioLogado.senha = nova;
  salvarUsuariosNoStorage();
  fecharModalTrocarMinhaSenha();
  alert("Senha alterada com sucesso!");
}

// --- GESTÃO DE EQUIPE (ADMINISTRADOR CRIA OS OUTROS) ---
function abrirModalColaborador(id) {
  if (usuarioLogado.perfil !== 'Administrador') {
    alert("Acesso Restrito: Apenas o Administrador pode cadastrar funcionários.");
    return;
  }

  var form = document.getElementById('formColaborador');
  if (form) form.reset();
  document.getElementById('colabId').value = "";
  document.getElementById('modalColabTitulo').innerText = "Cadastrar Funcionário";
  document.getElementById('btnSalvarColab').innerText = "Salvar Funcionário";

  aoMudarFuncaoHospitalar();

  if (id) {
    var u = usuariosSistema.find(function(item) { return item.id === id; });
    if (u) {
      document.getElementById('colabId').value = u.id;
      document.getElementById('colabNome').value = u.nome;
      document.getElementById('colabPerfil').value = u.perfil;
      document.getElementById('colabEmail').value = u.email;
      document.getElementById('colabRegistro').value = u.registro;
      document.getElementById('colabSenha').value = u.senha;
      document.getElementById('colabStatus').value = u.status;
      document.getElementById('modalColabTitulo').innerText = "Editar Funcionário — " + u.nome;
      document.getElementById('btnSalvarColab').innerText = "Gravar Alterações";
      aoMudarFuncaoHospitalar();
    }
  }

  document.getElementById('modalColaborador').style.display = 'flex';
}

function fecharModalColaborador() {
  document.getElementById('modalColaborador').style.display = 'none';
}

function salvarColaborador(e) {
  if (e) e.preventDefault();
  var id = document.getElementById('colabId').value;
  var nome = document.getElementById('colabNome').value.trim();
  var perfil = document.getElementById('colabPerfil').value;
  var email = document.getElementById('colabEmail').value.trim().toLowerCase();
  var registro = document.getElementById('colabRegistro').value.trim();
  var senha = document.getElementById('colabSenha').value.trim();
  var status = document.getElementById('colabStatus').value;

  if (id) {
    var idx = usuariosSistema.findIndex(function(u) { return u.id == id; });
    if (idx !== -1) {
      usuariosSistema[idx].nome = nome;
      usuariosSistema[idx].perfil = perfil;
      usuariosSistema[idx].email = email;
      usuariosSistema[idx].registro = registro;
      usuariosSistema[idx].senha = senha;
      usuariosSistema[idx].status = status;
    }
  } else {
    var ids = usuariosSistema.map(function(u) { return u.id || 0; });
    var novoId = ids.length ? Math.max.apply(null, ids) + 1 : 1;
    usuariosSistema.push({
      id: novoId,
      nome: nome,
      perfil: perfil,
      email: email,
      registro: registro,
      senha: senha,
      status: status
    });
  }

  salvarUsuariosNoStorage();
  fecharModalColaborador();
  renderizarEquipe();
}

function alternarStatusColaborador(id) {
  if (usuarioLogado.perfil !== 'Administrador') {
    alert("Apenas o Administrador pode ativar/desativar funcionários.");
    return;
  }
  var u = usuariosSistema.find(function(item) { return item.id === id; });
  if (!u || u.id === 1) {
    alert("O Administrador Geral padrão não pode ser desativado.");
    return;
  }
  u.status = (u.status === "Ativo") ? "Inativo" : "Ativo";
  salvarUsuariosNoStorage();
  renderizarEquipe();
}

function renderizarEquipe() {
  var tbody = document.getElementById('listaEquipeCorpo');
  if (!tbody) return;

  tbody.innerHTML = usuariosSistema.map(function(u) {
    var badgeStatus = '<span class="status-badge-checagem status-executado">Ativo</span>';
    if (u.status === "Inativo") {
      badgeStatus = '<span class="status-badge-checagem status-pendente">Inativo</span>';
    }

    return '<tr>' +
      '<td><code>FUNC-0' + u.id + '</code></td>' +
      '<td><strong>' + u.nome + '</strong></td>' +
      '<td>' + u.email + '</td>' +
      '<td><span class="badge-role">' + u.perfil + '</span></td>' +
      '<td>' + u.registro + '</td>' +
      '<td>' + badgeStatus + '</td>' +
      '<td>' +
        '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
          '<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" type="button" onclick="abrirModalColaborador(' + u.id + ')">✏️ Editar / Senha</button>' +
          (u.id !== 1 ? '<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" type="button" onclick="alternarStatusColaborador(' + u.id + ')">' + (u.status === "Ativo" ? "Desativar" : "Ativar") + '</button>' : '') +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// --- PROCEDIMENTO AVULSO ---
var contadorInsumosProcAvulso = 0;

function abrirModalProcedimentoAvulso() {
  if (usuarioLogado.perfil !== 'Medico' && usuarioLogado.perfil !== 'Enfermeiro' && usuarioLogado.perfil !== 'TecnicoEnfermagem' && usuarioLogado.perfil !== 'Administrador') {
    alert("Acesso Restrito: Somente equipe de enfermagem e médica pode registrar procedimentos.");
    return;
  }

  var modal = document.getElementById('modalProcedimentoAvulso');
  if (!modal) return;

  if (pacienteAtivo) {
    document.getElementById('modalProcedimentoSubinfo').innerText = "Paciente: " + pacienteAtivo.nome + " (" + pacienteAtivo.prontuario + ")";
  }

  document.getElementById('procDescricao').value = "";
  document.getElementById('procObservacoes').value = "";
  var container = document.getElementById('listaInsumosProcAvulso');
  container.innerHTML = "";
  contadorInsumosProcAvulso = 0;

  adicionarInsumoProcedimentoAvulso();
  modal.style.display = "flex";
}

function fecharModalProcedimentoAvulso() {
  var modal = document.getElementById('modalProcedimentoAvulso');
  if (modal) modal.style.display = "none";
}

function adicionarInsumoProcedimentoAvulso() {
  contadorInsumosProcAvulso++;
  var container = document.getElementById('listaInsumosProcAvulso');
  if (!container) return;

  var options = '<option value="">-- Sem Insumo / Selecionar do Estoque --</option>';
  estoqueInsumos.forEach(function(item) {
    options += '<option value="' + item.cod + '">' + item.nome + ' (Lote: ' + item.lote + ' | Saldo: ' + item.qtd + ')</option>';
  });

  var div = document.createElement('div');
  div.id = "linha-proc-avulso-" + contadorInsumosProcAvulso;
  div.style.cssText = "display:grid; grid-template-columns: 3fr 1fr auto; gap:8px; align-items:center;";
  div.innerHTML = '<select class="form-control proc-avulso-select">' + options + '</select>' +
    '<input type="number" class="form-control proc-avulso-qtd" value="1" min="1" placeholder="Qtd">' +
    '<button type="button" class="btn-remove-linha" onclick="removerInsumoProcedimentoAvulso(' + contadorInsumosProcAvulso + ')">✕</button>';
  container.appendChild(div);
}

function removerInsumoProcedimentoAvulso(id) {
  var el = document.getElementById("linha-proc-avulso-" + id);
  if (el) el.remove();
}

function salvarProcedimentoAvulsoModal(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  var descInput = document.getElementById('procDescricao');
  if (!descInput || !descInput.value.trim()) {
    alert("Informe a descrição do procedimento realizado.");
    return false;
  }

  var linhas = document.querySelectorAll('#listaInsumosProcAvulso > div');
  var insumosParaBaixa = [];

  for (var i = 0; i < linhas.length; i++) {
    var linha = linhas[i];
    var select = linha.querySelector('.proc-avulso-select');
    var qtdInput = linha.querySelector('.proc-avulso-qtd');
    var cod = select ? select.value : '';
    var qtd = qtdInput ? parseInt(qtdInput.value) : 0;

    if (cod && qtd > 0) {
      var itemEst = estoqueInsumos.find(function(est) { return est.cod === cod; });
      if (!itemEst) {
        alert("Insumo selecionado não localizado.");
        return false;
      }
      if (itemEst.qtd < qtd) {
        alert('Saldo insuficiente de "' + itemEst.nome + '"! Saldo disponível: ' + itemEst.qtd + ', solicitado: ' + qtd + '.');
        return false;
      }
      insumosParaBaixa.push({ cod: itemEst.cod, nome: itemEst.nome, qtd: qtd, lote: itemEst.lote });
    }
  }

  var resumoBaixaTexto = [];
  insumosParaBaixa.forEach(function(insumo) {
    var itemEst = estoqueInsumos.find(function(est) { return est.cod === insumo.cod; });
    if (itemEst) {
      itemEst.qtd -= insumo.qtd;
      resumoBaixaTexto.push(insumo.qtd + "x " + itemEst.nome + " (Lote: " + insumo.lote + ")");
    }
  });

  var dataHora = new Date().toLocaleString('pt-BR');
  var obs = document.getElementById('procObservacoes').value.trim();
  var logInsumos = resumoBaixaTexto.length > 0 ? resumoBaixaTexto.join(', ') : "Nenhum insumo debitado";

  if (!pacienteAtivo.procedimentos) pacienteAtivo.procedimentos = [];
  pacienteAtivo.procedimentos.unshift({
    autor: usuarioLogado.nome,
    cargo: usuarioLogado.perfil + " (" + usuarioLogado.registro + ")",
    dataHora: dataHora,
    procedimento: descInput.value.trim() + (obs ? (" — " + obs) : ""),
    insumos: logInsumos
  });

  fecharModalProcedimentoAvulso();
  renderizarEstoque();
  renderizarProcedimentos();
  return false;
}

// --- PRODUTOS DO ESTOQUE ---
function abrirModalProdutoSanitario(cod) {
  var form = document.getElementById('formProdutoSanitario');
  if (form) form.reset();
  document.getElementById('prodEditIndex').value = "";
  document.getElementById('modalProdutoTitulo').innerText = "Cadastrar Produto / Insumo";
  document.getElementById('btnSalvarProduto').innerText = "Salvar no Estoque";

  if (cod) {
    var p = estoqueInsumos.find(function(i) { return i.cod === cod; });
    if (p) {
      document.getElementById('prodEditIndex').value = p.cod;
      document.getElementById('prodNome').value = p.nome;
      document.getElementById('prodPrincipio').value = p.principio || '';
      document.getElementById('prodRegistroSanitario').value = p.registroSanitario || '';
      document.getElementById('prodLote').value = p.lote || '';
      document.getElementById('prodValidade').value = p.validade || '';
      document.getElementById('prodFabricacao').value = p.fabricacao || '';
      document.getElementById('prodFabricante').value = p.fabricante || '';
      document.getElementById('prodCategoria').value = p.cat || 'Medicamentos';
      document.getElementById('prodArmazenamento').value = p.armazenamento || 'Ambiente (15°C a 30°C)';
      document.getElementById('prodQtd').value = p.qtd;
      document.getElementById('prodMin').value = p.min;
      document.getElementById('prodUnidade').value = p.unidade || 'Ampola';
      document.getElementById('modalProdutoTitulo').innerText = "Editar Produto (" + p.cod + ")";
      document.getElementById('btnSalvarProduto').innerText = "Gravar Alterações";
    }
  }

  var modal = document.getElementById('modalProdutoSanitario');
  if (modal) modal.style.display = "flex";
}

function fecharModalProdutoSanitario() {
  var modal = document.getElementById('modalProdutoSanitario');
  if (modal) modal.style.display = "none";
}

function salvarProdutoSanitario(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  var nomeInput = document.getElementById('prodNome');
  if (!nomeInput || !nomeInput.value.trim()) {
    alert("Informe ao menos o nome comercial do produto.");
    return false;
  }

  var codEdit = document.getElementById('prodEditIndex').value;

  var dadosProduto = {
    nome: nomeInput.value.trim(),
    principio: document.getElementById('prodPrincipio') ? document.getElementById('prodPrincipio').value.trim() : '',
    registroSanitario: document.getElementById('prodRegistroSanitario') ? document.getElementById('prodRegistroSanitario').value.trim() : 'Isento/Notificado',
    lote: document.getElementById('prodLote') ? document.getElementById('prodLote').value.trim() : 'LOTE-PADRAO',
    validade: document.getElementById('prodValidade') ? document.getElementById('prodValidade').value : '',
    fabricacao: document.getElementById('prodFabricacao') ? document.getElementById('prodFabricacao').value : '',
    fabricante: document.getElementById('prodFabricante') ? document.getElementById('prodFabricante').value.trim() : '',
    cat: document.getElementById('prodCategoria') ? document.getElementById('prodCategoria').value : 'Medicamentos',
    armazenamento: document.getElementById('prodArmazenamento') ? document.getElementById('prodArmazenamento').value : 'Ambiente (15°C a 30°C)',
    qtd: parseInt(document.getElementById('prodQtd').value) || 0,
    min: parseInt(document.getElementById('prodMin').value) || 1,
    unidade: document.getElementById('prodUnidade') ? document.getElementById('prodUnidade').value : 'Unidade'
  };

  if (codEdit) {
    var idx = estoqueInsumos.findIndex(function(i) { return i.cod === codEdit; });
    if (idx !== -1) {
      estoqueInsumos[idx] = Object.assign({}, estoqueInsumos[idx], dadosProduto);
    }
  } else {
    var novoCod = "INS-" + String(estoqueInsumos.length + 1).padStart(3, '0');
    estoqueInsumos.push(Object.assign({ cod: novoCod }, dadosProduto));
  }

  fecharModalProdutoSanitario();
  renderizarEstoque();
  return false;
}

function formatarDataBR(dataStr) {
  if (!dataStr) return "--";
  var p = dataStr.split('-');
  return (p.length === 3) ? (p[2] + "/" + p[1] + "/" + p[0]) : dataStr;
}

function verificarStatusValidade(validadeStr) {
  if (!validadeStr) return { texto: "Sem Data", classe: "status-pendente" };
  var hoje = new Date();
  var dtVal = new Date(validadeStr);
  var diffDias = Math.floor((dtVal - hoje) / (1000 * 60 * 60 * 24));

  if (diffDias < 0) {
    return { texto: "VENCIDO", classe: "status-vencido" };
  } else if (diffDias <= 90) {
    return { texto: "Vence em " + diffDias + " dias", classe: "status-alerta" };
  } else {
    return { texto: "Vigente / Regular", classe: "status-executado" };
  }
}

function renderizarEstoque() {
  var tbody = document.getElementById('listaEstoqueCorpo');
  if (!tbody) return;

  tbody.innerHTML = estoqueInsumos.map(function(item) {
    var criticoQtd = item.qtd <= item.min;
    var statusVal = verificarStatusValidade(item.validade);

    return '<tr>' +
      '<td><code>' + item.cod + '</code></td>' +
      '<td><strong>' + item.nome + '</strong><br><small style="color:var(--text-muted);">' + (item.principio || item.cat) + '</small></td>' +
      '<td><small><strong>' + (item.registroSanitario || 'Isento/Notificado') + '</strong></small></td>' +
      '<td><code>' + (item.lote || 'N/A') + '</code></td>' +
      '<td>' + formatarDataBR(item.validade) + '</td>' +
      '<td><small>' + (item.armazenamento || 'Ambiente') + '</small></td>' +
      '<td><strong style="color: ' + (criticoQtd ? '#b91c1c' : '#1e382b') + '">' + item.qtd + ' ' + (item.unidade || 'un') + '</strong></td>' +
      '<td>' + item.min + '</td>' +
      '<td><span class="status-badge-checagem ' + statusVal.classe + '">' + statusVal.texto + '</span>' +
      (criticoQtd ? '<br><small style="color:#b91c1c; font-weight:700;">Estoque Crítico</small>' : '') + '</td>' +
      '<td><button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" type="button" onclick="abrirModalProdutoSanitario(\'' + item.cod + '\')">✏️ Editar</button></td>' +
    '</tr>';
  }).join('');
}

function imprimirRelatorioEstoquePDF() {
  var agora = new Date();
  var dataExtenso = agora.toLocaleDateString('pt-BR');
  var hora = agora.toLocaleTimeString('pt-BR');

  var printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Permita pop-ups no navegador para emitir o relatório em PDF.");
    return;
  }

  var linhasHtml = estoqueInsumos.map(function(item, idx) {
    var stVal = verificarStatusValidade(item.validade);
    var bg = (idx % 2 === 0) ? 'background-color: #fafbfb;' : '';
    return '<tr style="border-bottom: 1px solid #ddd; ' + bg + '">' +
      '<td style="padding: 6px; font-family: monospace;">' + item.cod + '</td>' +
      '<td style="padding: 6px;"><strong>' + item.nome + '</strong><br><span style="font-size: 8pt; color: #555;">DCI: ' + (item.principio || '-') + ' | Fabr: ' + (item.fabricante || '-') + '</span></td>' +
      '<td style="padding: 6px; font-size: 8pt;">' + (item.registroSanitario || 'N/A') + '</td>' +
      '<td style="padding: 6px; font-family: monospace;">' + (item.lote || 'N/A') + '</td>' +
      '<td style="padding: 6px;">' + formatarDataBR(item.validade) + '</td>' +
      '<td style="padding: 6px; font-size: 8pt;">' + (item.armazenamento || 'Ambiente') + '</td>' +
      '<td style="padding: 6px; text-align: center; font-weight: bold;">' + item.qtd + ' ' + (item.unidade || 'un') + '</td>' +
      '<td style="padding: 6px; text-align: center;">' + item.min + '</td>' +
      '<td style="padding: 6px; font-size: 8pt;">' + stVal.texto + '</td>' +
    '</tr>';
  }).join('');

  printWindow.document.write(
    '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Livro de Registro e Rastreabilidade — LEVEH</title>' +
    '<style>' +
    'body { font-family: Arial, sans-serif; font-size: 9pt; color: #222; margin: 20mm 15mm; }' +
    '.cabecalho { border-bottom: 2px solid #1e382b; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }' +
    '.logo-title { font-size: 18pt; font-weight: 800; color: #1e382b; letter-spacing: 1px; }' +
    '.subinfo { font-size: 8pt; color: #555; line-height: 1.4; }' +
    '.doc-title { text-align: center; font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 16px 0 8px; color: #1e382b; }' +
    '.doc-meta { font-size: 8.5pt; color: #444; margin-bottom: 14px; background: #f4f6f5; padding: 8px 12px; border-radius: 4px; }' +
    'table { width: 100%; border-collapse: collapse; margin-top: 8px; }' +
    'th { background: #1e382b; color: #fff; font-size: 8pt; font-weight: 600; text-align: left; padding: 6px; text-transform: uppercase; }' +
    '.rodape { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 8pt; color: #777; display: flex; justify-content: space-between; }' +
    '@media print { @page { size: A4 landscape; margin: 12mm 10mm; } body { margin: 0; } }' +
    '</style></head><body>' +
    '<div class="cabecalho"><div><div class="logo-title">CLÍNICA LEVEH</div><div class="subinfo">LEVEH SERVIÇOS EM SAÚDE E NUTRIÇÃO INTEGRADA LTDA<br>CNPJ: 00.000.000/0001-00 | Campo Grande - MS<br>Responsabilidade Técnica: Dra. Estéfana Andrade (CRN-3 10842) / Dr. Roberto Costa (CRM-MS 9421)</div></div><div style="text-align: right;" class="subinfo"><strong>LIVRO DE REGISTRO E CONTROLE TÉCNICO</strong><br>Apresentação Oficial de Rastreabilidade<br>Data/Hora: ' + dataExtenso + ', às ' + hora + '</div></div>' +
    '<div class="doc-title">Inventário Físico e Rastreabilidade de Medicamentos & Insumos</div>' +
    '<div class="doc-meta"><strong>Finalidade do Documento:</strong> Registro de inventário contínuo e comprovação de rastreabilidade de lote, prazo de validade, acondicionamento térmico e quantitativo em estoque físico.</div>' +
    '<table><thead><tr><th>Cód.</th><th>Item / Princípio Ativo / Fabricante</th><th>Reg. Sanitário</th><th>Lote</th><th>Validade</th><th>Armazenamento</th><th style="text-align: center;">Saldo</th><th style="text-align: center;">Mín.</th><th>Situação</th></tr></thead><tbody>' +
    linhasHtml +
    '</tbody></table>' +
    '<div class="rodape"><div>Documento gerado eletronicamente pelo Sistema de Prontuário e Gestão Clínica LEVEH.</div><div>Assinatura do Responsável Técnico: ___________________________________________</div></div>' +
    '<script>window.onload = function() { window.print(); };</script>' +
    '</body></html>'
  );
  printWindow.document.close();
}

// --- PACIENTES ---
function abrirModalNovoPaciente() {
  var form = document.getElementById('formPaciente');
  if (form) form.reset();
  var idField = document.getElementById('pacienteId');
  if (idField) idField.value = "";
  var tit = document.getElementById('modalPacienteTitulo');
  if (tit) tit.innerText = "Cadastrar Novo Paciente";
  var out = document.getElementById('pacIdade');
  if (out) out.value = "";
  var modal = document.getElementById('modalPaciente');
  if (modal) modal.style.display = "flex";
}

function abrirModalEdicaoPaciente(id) {
  var p = bancoPacientes.find(function(item) { return item.id === id; });
  if (!p) return;

  document.getElementById('pacienteId').value = p.id;
  document.getElementById('pacNome').value = p.nome || '';
  document.getElementById('pacCpf').value = p.cpf || '';
  document.getElementById('pacNascimento').value = p.nascimento || '';
  document.getElementById('pacIdade').value = calcularIdade(p.nascimento);
  document.getElementById('pacSexo').value = p.sexo || 'F';
  document.getElementById('pacTelefone').value = p.telefone || '';
  document.getElementById('pacEmail').value = p.email || '';
  document.getElementById('pacConvenio').value = p.convenio || '';
  document.getElementById('pacEndereco').value = p.endereco || '';
  document.getElementById('pacCidade').value = p.cidade || 'Campo Grande - MS';
  document.getElementById('pacAlergias').value = p.alergias || '';
  document.getElementById('pacCondicoes').value = p.condicoes || '';
  document.getElementById('pacObs').value = p.obs || '';

  document.getElementById('modalPacienteTitulo').innerText = "Editar Cadastro — " + p.prontuario;
  document.getElementById('modalPaciente').style.display = "flex";
}

function fecharModalPaciente() {
  var modal = document.getElementById('modalPaciente');
  if (modal) modal.style.display = "none";
}

function salvarPaciente(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  var id = document.getElementById('pacienteId').value;
  var nomeInput = document.getElementById('pacNome');
  if (!nomeInput || !nomeInput.value.trim()) {
    alert("Informe o nome completo do paciente.");
    return false;
  }

  var dados = {
    nome: nomeInput.value.trim(),
    cpf: document.getElementById('pacCpf') ? document.getElementById('pacCpf').value.trim() : '',
    nascimento: document.getElementById('pacNascimento') ? document.getElementById('pacNascimento').value : '',
    sexo: document.getElementById('pacSexo') ? document.getElementById('pacSexo').value : 'F',
    telefone: document.getElementById('pacTelefone') ? document.getElementById('pacTelefone').value.trim() : '',
    email: document.getElementById('pacEmail') ? document.getElementById('pacEmail').value.trim() : '',
    convenio: document.getElementById('pacConvenio') ? document.getElementById('pacConvenio').value.trim() : 'Particular',
    endereco: document.getElementById('pacEndereco') ? document.getElementById('pacEndereco').value.trim() : '',
    cidade: document.getElementById('pacCidade') ? document.getElementById('pacCidade').value.trim() : 'Campo Grande - MS',
    alergias: document.getElementById('pacAlergias') ? document.getElementById('pacAlergias').value.trim() : 'Nenhuma',
    condicoes: document.getElementById('pacCondicoes') ? document.getElementById('pacCondicoes').value.trim() : '',
    obs: document.getElementById('pacObs') ? document.getElementById('pacObs').value.trim() : ''
  };

  if (id) {
    var idx = bancoPacientes.findIndex(function(item) { return item.id == id; });
    if (idx !== -1) {
      bancoPacientes[idx] = Object.assign({}, bancoPacientes[idx], dados);
    }
  } else {
    var ids = bancoPacientes.map(function(p) { return p.id || 0; });
    var novoId = ids.length ? Math.max.apply(null, ids) + 1 : 1;
    var novoProntuario = "PRON-" + Math.floor(1000 + Math.random() * 9000);
    bancoPacientes.unshift(Object.assign({
      id: novoId,
      prontuario: novoProntuario,
      evolucoes: [],
      procedimentos: [],
      prescricoesMedicas: []
    }, dados));
  }

  fecharModalPaciente();
  renderizarPacientes();
  return false;
}

function renderizarPacientes() {
  var tbody = document.getElementById('listaPacientesCorpo');
  if (!tbody) return;
  tbody.innerHTML = bancoPacientes.map(function(p) {
    return '<tr>' +
      '<td><strong>' + p.prontuario + '</strong></td>' +
      '<td><strong>' + p.nome + '</strong></td>' +
      '<td>' + calcularIdade(p.nascimento) + '</td>' +
      '<td>' + (p.sexo || '-') + '</td>' +
      '<td>' + (p.convenio || 'Particular') + '</td>' +
      '<td>' + (p.telefone || '-') + '</td>' +
      '<td><div style="display:flex; gap:6px;">' +
        '<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" type="button" onclick="abrirModalEdicaoPaciente(' + p.id + ')">✏️ Editar</button>' +
        '<button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" type="button" onclick="abrirProntuario(' + p.id + ')">📋 Prontuário</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');
}

// --- FICHA EXPANSÍVEL ---
function alternarFichaCompleta() {
  var gaveta = document.getElementById('gavetaFichaPaciente');
  var btn = document.getElementById('btnToggleFicha');
  if (!gaveta || !btn) return;
  var aberta = gaveta.classList.toggle('ativa');
  btn.innerHTML = aberta ? '<span>▲ Ocultar Ficha</span>' : '<span>▼ Ficha Cadastral Completa</span>';
}

function montarFichaCompleta(p) {
  var container = document.getElementById('conteudoFichaPaciente');
  if (!container || !p) return;
  container.innerHTML =
    '<div class="ficha-dado-item"><strong>CPF:</strong> ' + (p.cpf || 'Não informado') + '</div>' +
    '<div class="ficha-dado-item"><strong>Nascimento:</strong> ' + (p.nascimento || 'Não informado') + ' (' + calcularIdade(p.nascimento) + ')</div>' +
    '<div class="ficha-dado-item"><strong>Sexo:</strong> ' + (p.sexo || 'Não informado') + '</div>' +
    '<div class="ficha-dado-item"><strong>Telefone:</strong> ' + (p.telefone || 'Não informado') + '</div>' +
    '<div class="ficha-dado-item"><strong>E-mail:</strong> ' + (p.email || 'Não informado') + '</div>' +
    '<div class="ficha-dado-item"><strong>Convênio:</strong> ' + (p.convenio || 'Particular') + '</div>' +
    '<div class="ficha-dado-item"><strong>Endereço:</strong> ' + (p.endereco || 'Não informado') + ' - ' + (p.cidade || '') + '</div>' +
    '<div class="ficha-dado-item" style="color:#a11414;"><strong>Alergias:</strong> ' + (p.alergias || 'Nenhuma') + '</div>' +
    '<div class="ficha-dado-item"><strong>Condições:</strong> ' + (p.condicoes || 'Nenhuma') + '</div>' +
    '<div class="ficha-dado-item" style="grid-column: 1 / -1;"><strong>Observações:</strong> ' + (p.obs || 'Nenhuma') + '</div>';
}

// --- NAVEGAÇÃO LATERAL ---
function trocarAbaLateral(abaId) {
  document.querySelectorAll('#menuProntuarioPaciente .nav-item').forEach(function(el) { el.classList.remove('active'); });
  document.querySelectorAll('.tab-content-item').forEach(function(c) { c.style.display = 'none'; });

  var btnLateral = document.getElementById('side-' + abaId);
  if (btnLateral) btnLateral.classList.add('active');

  abaAtivaAtual = abaId;
  var target = document.getElementById(abaId);
  if (target) target.style.display = 'block';

  if (abaId === 'aba-procedimentos') {
    renderizarChecagemPrescricao();
    renderizarProcedimentos();
  } else if (abaId === 'aba-prescricao-medica') {
    renderizarPrescricoesMedicas();
  }
}

function abrirProntuario(id) {
  var p = bancoPacientes.find(function(item) { return item.id === id; });
  if (!p) return;
  pacienteAtivo = p;

  var title = document.getElementById('pageTitle');
  if (title) {
    title.innerHTML = '<div class="paciente-header-topbar">' +
      '<span class="paciente-header-nome">' + p.nome + '</span>' +
      '<span class="paciente-header-badge">' + p.prontuario + '</span>' +
      '<span class="paciente-header-badge">' + calcularIdade(p.nascimento) + '</span>' +
      '<span class="paciente-header-badge">' + (p.convenio || 'Particular') + '</span>' +
    '</div>';
  }

  montarFichaCompleta(p);
  var gaveta = document.getElementById('gavetaFichaPaciente');
  if (gaveta) gaveta.classList.remove('ativa');
  var btn = document.getElementById('btnToggleFicha');
  if (btn) btn.innerHTML = '<span>▼ Ficha Cadastral Completa</span>';

  var menuGeral = document.getElementById('menuGeralSistema');
  var menuPront = document.getElementById('menuProntuarioPaciente');
  if (menuGeral) menuGeral.style.display = 'none';
  if (menuPront) menuPront.style.display = 'block';

  trocarAbaLateral('aba-evolucao');
  renderizarEvolucoes();
  renderizarProcedimentos();
  renderizarChecagemPrescricao();
  renderizarPrescricoesMedicas();
  navegarPara('prontuario');
}

function voltarParaListaPacientes() {
  var menuGeral = document.getElementById('menuGeralSistema');
  var menuPront = document.getElementById('menuProntuarioPaciente');
  if (menuGeral) menuGeral.style.display = 'block';
  if (menuPront) menuPront.style.display = 'none';

  navegarPara('pacientes');
}

function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('expanded');
}

function navegarPara(moduloId) {
  document.querySelectorAll('.view-section').forEach(function(sec) { sec.style.display = 'none'; });
  document.querySelectorAll('.nav-item').forEach(function(el) { el.classList.remove('active'); });

  var view = document.getElementById('view-' + moduloId);
  var navBtn = document.getElementById('nav-' + moduloId);
  var pageTitle = document.getElementById('pageTitle');

  if (view) view.style.display = 'block';
  if (navBtn) navBtn.classList.add('active');

  var titulos = {
    pacientes: "Pacientes",
    prontuario: "Prontuário Clínico",
    agenda: "Agenda & Calendário",
    estoque: "Estoque & Insumos",
    equipe: "Equipe Hospitalar & Perfis",
    taco: "Tabela TACO",
    substituicao: "Listas de Substituição",
    pop: "Procedimentos (POP)"
  };
  if (pageTitle && moduloId !== 'prontuario' && titulos[moduloId]) {
    pageTitle.innerText = titulos[moduloId];
  }
}

// --- EVOLUÇÕES ---
function alternarLerEvolucao(id) {
  var card = document.getElementById('evolucao-card-' + id);
  var btn = document.getElementById('btn-ler-evolucao-' + id);
  if (!card || !btn) return;
  var aberta = card.classList.toggle('aberta');
  btn.innerText = aberta ? "▲ Fechar" : "📖 Ler Evolução";
}

function renderizarEvolucoes() {
  var box = document.getElementById('historicoEvolucoes');
  if (!box) return;
  if (!pacienteAtivo || !pacienteAtivo.evolucoes || pacienteAtivo.evolucoes.length === 0) {
    box.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:14px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border);">Nenhuma anotação registrada. Clique em <strong>+ Nova Evolução</strong> acima.</div>';
    return;
  }
  box.innerHTML = pacienteAtivo.evolucoes.map(function(ev) {
    var textoLimpo = ev.texto || '';
    var resumo = textoLimpo.length > 90 ? textoLimpo.substring(0, 90) + '...' : textoLimpo;
    return '<div class="evolucao-card" id="evolucao-card-' + ev.id + '">' +
      '<div class="evolucao-header">' +
        '<div><span class="evolucao-autor">' + ev.autor + '</span><span class="evolucao-cargo">— ' + ev.cargo + '</span></div>' +
        '<div style="display:flex; align-items:center; gap:8px;"><span class="evolucao-datahora">📅 ' + ev.dataHora + '</span><button class="btn-ler-evolucao" id="btn-ler-evolucao-' + ev.id + '" type="button" onclick="alternarLerEvolucao(' + ev.id + ')">📖 Ler Evolução</button></div>' +
      '</div>' +
      '<div class="evolucao-resumo-uma-linha">' + resumo + '</div>' +
      '<div class="evolucao-texto-completo">' + textoLimpo + '</div>' +
    '</div>';
  }).join('');
}

// --- PRESCRIÇÃO MÉDICA ---
var contadorLinhasPrescricao = 0;

function gerarOptionsEstoque() {
  var opts = '<option value="">-- Selecione do Estoque ou digite outro --</option>';
  estoqueInsumos.forEach(function(item) {
    var semSaldo = item.qtd <= 0;
    opts += '<option value="' + item.cod + '" ' + (semSaldo ? 'disabled style="color:#a11414;"' : '') + '>' +
      item.nome + ' (' + (semSaldo ? 'SEM ESTOQUE' : ('Lote: ' + item.lote + ' | Disp: ' + item.qtd)) + ')' +
    '</option>';
  });
  return opts;
}

function abrirModalPrescricao() {
  if (usuarioLogado.perfil !== 'Medico' && usuarioLogado.perfil !== 'Administrador') {
    alert("Acesso Negado: Apenas o Médico (CRM) tem permissão legal para emitir prescrições médicas.");
    return;
  }

  var modal = document.getElementById('modalPrescricao');
  var container = document.getElementById('containerItensPrescricao');
  if (!modal || !container) return;

  if (pacienteAtivo) {
    document.getElementById('modalPrescricaoSubinfo').innerText = "Paciente: " + pacienteAtivo.nome + " (" + pacienteAtivo.prontuario + ")";
  }
  document.getElementById('prescricaoObsGerais').value = "";
  container.innerHTML = "";
  contadorLinhasPrescricao = 0;

  adicionarLinhaPrescricao();
  modal.style.display = "flex";
}

function fecharModalPrescricao() {
  var modal = document.getElementById('modalPrescricao');
  if (modal) modal.style.display = "none";
}

function adicionarLinhaPrescricao() {
  contadorLinhasPrescricao++;
  var container = document.getElementById('containerItensPrescricao');
  if (!container) return;

  var div = document.createElement('div');
  div.className = "linha-item-prescricao";
  div.id = "linha-presc-" + contadorLinhasPrescricao;
  div.innerHTML = '<div>' +
    '<select class="form-control item-presc-estoque-select" onchange="aoSelecionarInsumoEstoque(' + contadorLinhasPrescricao + ')">' +
      gerarOptionsEstoque() +
    '</select>' +
    '<input type="text" class="form-control item-presc-nome" placeholder="Nome do Medicamento / Item *" style="margin-top:4px;" required>' +
  '</div>' +
  '<input type="text" class="form-control item-presc-dose" placeholder="Dose (ex: 1 ampola / 500mg)" required>' +
  '<select class="form-control item-presc-via">' +
    '<option value="EV">EV / IV</option><option value="IM">IM</option><option value="VO">VO (Oral)</option><option value="SC">SC</option><option value="Inalação">Inalação</option><option value="Tópico">Tópico</option>' +
  '</select>' +
  '<input type="text" class="form-control item-presc-posologia" placeholder="Horário (ex: 8/8h ou Agora)">' +
  '<button type="button" class="btn-remove-linha" onclick="removerLinhaPrescricao(' + contadorLinhasPrescricao + ')">✕</button>';
  container.appendChild(div);
}

function removerLinhaPrescricao(linhaId) {
  var el = document.getElementById("linha-presc-" + linhaId);
  if (el) el.remove();
}

function aoSelecionarInsumoEstoque(linhaId) {
  var linha = document.getElementById("linha-presc-" + linhaId);
  if (!linha) return;
  var select = linha.querySelector('.item-presc-estoque-select');
  var inputNome = linha.querySelector('.item-presc-nome');
  var cod = select.value;
  if (!cod) return;

  var item = estoqueInsumos.find(function(i) { return i.cod === cod; });
  if (item) {
    if (item.qtd <= 0) {
      alert('Atenção: O item "' + item.nome + '" está zerado no estoque!');
      select.value = "";
      return;
    }
    inputNome.value = item.nome;
  }
}

function salvarPrescricaoMedicaModal(e) {
  if (e) e.preventDefault();
  if (!pacienteAtivo) return;

  var linhas = document.querySelectorAll('.linha-item-prescricao');
  var itensPrescritos = [];

  for (var i = 0; i < linhas.length; i++) {
    var linha = linhas[i];
    var select = linha.querySelector('.item-presc-estoque-select');
    var nome = linha.querySelector('.item-presc-nome').value.trim();
    var dose = linha.querySelector('.item-presc-dose').value.trim();
    var via = linha.querySelector('.item-presc-via').value;
    var posologia = linha.querySelector('.item-presc-posologia').value.trim() || 'Conforme prescrito';
    var codEstoque = select ? select.value : '';

    if (codEstoque) {
      var itemEstoque = estoqueInsumos.find(function(item) { return item.cod === codEstoque; });
      if (itemEstoque && itemEstoque.qtd <= 0) {
        alert('O medicamento "' + itemEstoque.nome + '" não possui saldo suficiente no estoque.');
        return;
      }
    }

    if (nome) {
      itensPrescritos.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        codEstoque: codEstoque,
        medicamento: nome,
        dose: dose,
        via: via,
        posologia: posologia,
        checado: false,
        checadoPor: "",
        checadoEm: "",
        insumosGastosConfirmados: []
      });
    }
  }

  if (itensPrescritos.length === 0) {
    alert("Adicione ao menos um item válido na prescrição.");
    return;
  }

  var dataHora = new Date().toLocaleString('pt-BR');
  var obs = document.getElementById('prescricaoObsGerais').value.trim();

  var novaPrescricao = {
    id: Date.now(),
    autor: usuarioLogado.nome,
    cargo: usuarioLogado.perfil + " (" + usuarioLogado.registro + ")",
    dataHora: dataHora,
    obsGerais: obs,
    itens: itensPrescritos
  };

  if (!pacienteAtivo.prescricoesMedicas) pacienteAtivo.prescricoesMedicas = [];
  pacienteAtivo.prescricoesMedicas.unshift(novaPrescricao);

  fecharModalPrescricao();
  renderizarPrescricoesMedicas();
  renderizarChecagemPrescricao();
}

function renderizarPrescricoesMedicas() {
  var box = document.getElementById('historicoPrescricoesMedicas');
  if (!box) return;
  if (!pacienteAtivo || !pacienteAtivo.prescricoesMedicas || pacienteAtivo.prescricoesMedicas.length === 0) {
    box.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:14px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border);">Nenhuma prescrição ativa. Médicos podem clicar em <strong>+ Adicionar Prescrição</strong> acima.</div>';
    return;
  }

  box.innerHTML = pacienteAtivo.prescricoesMedicas.map(function(pr) {
    var linhasItens = pr.itens.map(function(it) {
      return '<tr>' +
        '<td style="padding:6px 10px;"><strong>' + it.medicamento + '</strong></td>' +
        '<td style="padding:6px 10px;">' + it.dose + '</td>' +
        '<td style="padding:6px 10px;">' + it.via + '</td>' +
        '<td style="padding:6px 10px;">' + it.posologia + '</td>' +
        '<td style="padding:6px 10px;"><span class="status-badge-checagem ' + (it.checado ? 'status-executado' : 'status-pendente') + '">' +
          (it.checado ? ('Checado por ' + it.checadoPor + ' (' + it.checadoEm + ')') : 'Pendente de Administração') +
        '</span></td>' +
      '</tr>';
    }).join('');

    return '<div class="evolucao-card" style="border-left-color: #2b5585; margin-bottom: 14px;">' +
      '<div class="evolucao-header">' +
        '<div><span class="evolucao-autor" style="color:#1d3d63;">' + pr.autor + '</span><span class="evolucao-cargo">— ' + pr.cargo + '</span></div>' +
        '<span class="evolucao-datahora">📅 Emitida em: ' + pr.dataHora + '</span>' +
      '</div>' +
      '<div style="margin-top:10px;">' +
        '<table style="width:100%; border:1px solid var(--border); font-size:0.85rem; background:#fff;">' +
          '<thead><tr style="background:#f3f6f9;"><th style="padding:6px 10px;">Medicamento / Item</th><th style="padding:6px 10px;">Dose</th><th style="padding:6px 10px;">Via</th><th style="padding:6px 10px;">Posologia</th><th style="padding:6px 10px;">Status Enfermagem</th></tr></thead>' +
          '<tbody>' + linhasItens + '</tbody>' +
        '</table>' +
        (pr.obsGerais ? ('<div style="margin-top:8px; font-size:0.82rem; color:var(--text-muted);"><strong>Orientações:</strong> ' + pr.obsGerais + '</div>') : '') +
      '</div>' +
    '</div>';
  }).join('');
}

// --- CHECAGEM ---
function renderizarChecagemPrescricao() {
  var container = document.getElementById('listaChecagemPrescricao');
  if (!container) return;

  if (!pacienteAtivo || !pacienteAtivo.prescricoesMedicas || pacienteAtivo.prescricoesMedicas.length === 0) {
    container.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:12px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border);">Nenhuma prescrição médica disponível para checagem neste paciente.</div>';
    return;
  }

  var todosItens = [];
  pacienteAtivo.prescricoesMedicas.forEach(function(presc) {
    presc.itens.forEach(function(item) {
      todosItens.push(Object.assign({}, item, { prescId: presc.id, medico: presc.autor }));
    });
  });

  container.innerHTML = todosItens.map(function(it) {
    return '<div class="item-checagem-card ' + (it.checado ? 'checado' : '') + '">' +
      '<div class="item-checagem-info">' +
        '<strong>💊 ' + it.medicamento + ' — ' + it.dose + ' (' + it.via + ')</strong>' +
        '<span>Posologia: ' + it.posologia + ' | Prescrito por: ' + it.medico + '</span>' +
        '<div><span class="status-badge-checagem ' + (it.checado ? 'status-executado' : 'status-pendente') + '">' +
          (it.checado ? ('✓ Executado: ' + it.checadoPor + ' às ' + it.checadoEm) : '⏳ Pendente de Checagem') +
        '</span></div>' +
      '</div>' +
      '<div>' +
        (it.checado ?
          '<button class="btn btn-outline" style="padding:5px 10px; font-size:0.75rem;" disabled>✓ Já Administrado</button>' :
          '<button class="btn-checar" type="button" onclick="abrirModalChecagem(' + it.prescId + ', ' + it.id + ')">✓ Checar / Executar</button>'
        ) +
      '</div>' +
    '</div>';
  }).join('');
}

var contadorInsumosChecagem = 0;

function abrirModalChecagem(prescId, itemId) {
  if (usuarioLogado.perfil !== 'Enfermeiro' && usuarioLogado.perfil !== 'TecnicoEnfermagem' && usuarioLogado.perfil !== 'Medico' && usuarioLogado.perfil !== 'Administrador') {
    alert("Apenas a equipe de enfermagem ou médica pode checar e administrar itens da prescrição.");
    return;
  }

  var presc = pacienteAtivo.prescricoesMedicas.find(function(p) { return p.id === prescId; });
  if (!presc) return;
  var item = presc.itens.find(function(i) { return i.id === itemId; });
  if (!item || item.checado) return;

  document.getElementById('checagemPrescId').value = prescId;
  document.getElementById('checagemItemId').value = itemId;
  document.getElementById('checagemModalSubinfo').innerText = "Item: " + item.medicamento + " - " + item.dose + " (" + item.via + ")";
  document.getElementById('checagemObservacao').value = "";

  var container = document.getElementById('listaInsumosParaBaixa');
  container.innerHTML = "";
  contadorInsumosChecagem = 0;

  if (item.codEstoque) {
    adicionarLinhaInsumoChecagem(item.codEstoque, 1);
  } else {
    var match = estoqueInsumos.find(function(est) {
      return item.medicamento.toLowerCase().indexOf(est.nome.toLowerCase().split(' ')[0]) !== -1;
    });
    if (match) adicionarLinhaInsumoChecagem(match.cod, 1);
  }

  if (item.via === 'EV' || item.via === 'IM') {
    adicionarLinhaInsumoChecagem("INS-004", 1);
    adicionarLinhaInsumoChecagem("INS-007", 1);
  }

  document.getElementById('modalConfirmacaoChecagem').style.display = "flex";
}

function fecharModalChecagem() {
  document.getElementById('modalConfirmacaoChecagem').style.display = "none";
}

function adicionarLinhaInsumoChecagem(codPadrao, qtdPadrao) {
  if (typeof qtdPadrao === 'undefined') qtdPadrao = 1;
  contadorInsumosChecagem++;
  var container = document.getElementById('listaInsumosParaBaixa');
  if (!container) return;

  var options = '<option value="">-- Escolha o Insumo do Estoque --</option>';
  estoqueInsumos.forEach(function(item) {
    var sel = (item.cod === codPadrao) ? 'selected' : '';
    options += '<option value="' + item.cod + '" ' + sel + '>' + item.nome + ' (Lote: ' + item.lote + ' | Saldo: ' + item.qtd + ')</option>';
  });

  var div = document.createElement('div');
  div.id = "linha-insumo-check-" + contadorInsumosChecagem;
  div.style.cssText = "display:grid; grid-template-columns: 3fr 1fr auto; gap:8px; align-items:center;";
  div.innerHTML = '<select class="form-control check-insumo-select" required>' + options + '</select>' +
    '<input type="number" class="form-control check-insumo-qtd" value="' + qtdPadrao + '" min="1" required placeholder="Qtd">' +
    '<button type="button" class="btn-remove-linha" onclick="removerLinhaInsumoChecagem(' + contadorInsumosChecagem + ')">✕</button>';
  container.appendChild(div);
}

function adicionarInsumoExtraChecagem() {
  adicionarLinhaInsumoChecagem("", 1);
}

function removerLinhaInsumoChecagem(linhaId) {
  var el = document.getElementById("linha-insumo-check-" + linhaId);
  if (el) el.remove();
}

function salvarChecagemComBaixaEstoque(e) {
  if (e) e.preventDefault();
  var prescId = parseInt(document.getElementById('checagemPrescId').value);
  var itemId = parseInt(document.getElementById('checagemItemId').value);

  var presc = pacienteAtivo.prescricoesMedicas.find(function(p) { return p.id === prescId; });
  if (!presc) return;
  var item = presc.itens.find(function(i) { return i.id === itemId; });
  if (!item || item.checado) return;

  var linhas = document.querySelectorAll('#listaInsumosParaBaixa > div');
  var insumosParaBaixa = [];

  for (var i = 0; i < linhas.length; i++) {
    var linha = linhas[i];
    var select = linha.querySelector('.check-insumo-select');
    var qtdInput = linha.querySelector('.check-insumo-qtd');
    var cod = select ? select.value : '';
    var qtd = qtdInput ? parseInt(qtdInput.value) : 0;

    if (cod && qtd > 0) {
      var itemEst = estoqueInsumos.find(function(est) { return est.cod === cod; });
      if (!itemEst) {
        alert("Insumo selecionado não localizado.");
        return;
      }
      if (itemEst.qtd < qtd) {
        alert('Saldo insuficiente de "' + itemEst.nome + '"! Saldo disponível: ' + itemEst.qtd + ', solicitado: ' + qtd + '.');
        return;
      }
      insumosParaBaixa.push({ cod: itemEst.cod, nome: itemEst.nome, qtd: qtd, lote: itemEst.lote });
    }
  }

  var resumoBaixaTexto = [];
  insumosParaBaixa.forEach(function(insumo) {
    var itemEst = estoqueInsumos.find(function(est) { return est.cod === insumo.cod; });
    if (itemEst) {
      itemEst.qtd -= insumo.qtd;
      resumoBaixaTexto.push(insumo.qtd + "x " + itemEst.nome + " (Lote: " + insumo.lote + ")");
    }
  });

  var dataHora = new Date().toLocaleString('pt-BR');
  var obs = document.getElementById('checagemObservacao').value.trim();

  item.checado = true;
  item.checadoPor = usuarioLogado.nome + " (" + usuarioLogado.registro + ")";
  item.checadoEm = dataHora;
  item.insumosGastosConfirmados = insumosParaBaixa;

  var logInsumos = resumoBaixaTexto.length > 0 ? resumoBaixaTexto.join(', ') : "Nenhum insumo debitado";
  if (!pacienteAtivo.procedimentos) pacienteAtivo.procedimentos = [];
  pacienteAtivo.procedimentos.unshift({
    autor: usuarioLogado.nome,
    cargo: usuarioLogado.perfil + " (" + usuarioLogado.registro + ")",
    dataHora: dataHora,
    procedimento: "Administração Checada: " + item.medicamento + " " + item.dose + " (" + item.via + ")" + (obs ? (" — Obs: " + obs) : ""),
    insumos: logInsumos
  });

  fecharModalChecagem();
  renderizarEstoque();
  renderizarChecagemPrescricao();
  renderizarProcedimentos();
  renderizarPrescricoesMedicas();
}

function renderizarProcedimentos() {
  var box = document.getElementById('historicoProcedimentos');
  if (!box) return;
  if (!pacienteAtivo || !pacienteAtivo.procedimentos || pacienteAtivo.procedimentos.length === 0) {
    box.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:14px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border);">Nenhum procedimento avulso registrado. Clique em <strong>+ Procedimento Avulso</strong> acima.</div>';
    return;
  }
  box.innerHTML = pacienteAtivo.procedimentos.map(function(p) {
    return '<div class="evolucao-card">' +
      '<div class="evolucao-header">' +
        '<div><span class="evolucao-autor">' + p.autor + '</span><span class="evolucao-cargo">— ' + p.cargo + '</span></div>' +
        '<span class="evolucao-datahora">📅 ' + p.dataHora + '</span>' +
      '</div>' +
      '<div class="evolucao-texto-completo" style="display:block;">' +
        '<strong>Procedimento:</strong> ' + p.procedimento + '<br>' +
        '<span style="color:#205c36; font-size:0.82rem; font-weight:600;">📦 Baixa no Estoque: ' + p.insumos + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

function lancarGenericoAba(abaId) {
  var titulos = {
    'aba-antropometria': 'Registro de Antropometria (Peso, Dobras, Altura)',
    'aba-bioimpedancia': 'Registro de Exame de Bioimpedância (% Gordura, Massa Magra)',
    'aba-prescricao': 'Nova Prescrição Nutricional (TACO)'
  };
  var val = prompt((titulos[abaId] || 'Novo Registro') + ':\n\nDigite os dados:');
  if (!val || !val.trim()) return;

  var containerId = 'historico' + abaId.replace('aba-', '').charAt(0).toUpperCase() + abaId.replace('aba-', '').slice(1);
  var container = document.getElementById(containerId);
  if (container) {
    var dataHora = new Date().toLocaleString('pt-BR');
    var html = '<div class="evolucao-card">' +
      '<div class="evolucao-header">' +
        '<div><span class="evolucao-autor">' + usuarioLogado.nome + '</span><span class="evolucao-cargo">— ' + usuarioLogado.perfil + '</span></div>' +
        '<span class="evolucao-datahora">📅 ' + dataHora + '</span>' +
      '</div>' +
      '<div class="evolucao-texto-completo" style="display:block;">' + val.trim() + '</div>' +
    '</div>';
    container.innerHTML = html + container.innerHTML;
  }
}

// --- EVOLUÇÃO E IALEVEH ---
function abrirModalEvolucao() {
  var m = document.getElementById('modalEvolucao');
  if (!m) return;
  if (pacienteAtivo) {
    document.getElementById('modalEvolucaoSubinfo').innerText = "Paciente: " + pacienteAtivo.nome + " (" + pacienteAtivo.prontuario + ")";
  }
  document.getElementById('modalTextoEvolucao').value = "";
  m.style.display = "flex";
}

function fecharModalEvolucao() {
  var m = document.getElementById('modalEvolucao');
  if (m) m.style.display = "none";
}

function alternarGravacaoIA() {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Reconhecimento de áudio disponível no Google Chrome.");
    return;
  }
  if (!gravandoAudio) {
    reconhecimentoVoz = new SpeechRecognition();
    reconhecimentoVoz.lang = 'pt-BR';
    reconhecimentoVoz.continuous = true;
    reconhecimentoVoz.onresult = function(ev) {
      for (var i = ev.resultIndex; i < ev.results.length; ++i) {
        if (ev.results[i].isFinal) transcricaoEmTempoReal += ev.results[i][0].transcript + " ";
      }
      document.getElementById('modalTextoEvolucao').value = transcricaoEmTempoReal;
    };
    reconhecimentoVoz.start();
    gravandoAudio = true;
    document.getElementById('btnCopilotoIA').classList.add('gravando');
    document.getElementById('labelCopilotoIA').innerText = "Gravando com IALEVEH...";
  } else {
    reconhecimentoVoz.stop();
    gravandoAudio = false;
    document.getElementById('btnCopilotoIA').classList.remove('gravando');
    document.getElementById('labelCopilotoIA').innerText = "IALEVEH (Gravar & Estruturar)";
  }
}

function salvarEvolucaoComMemoria(e) {
  if (e) e.preventDefault();
  var txt = document.getElementById('modalTextoEvolucao').value.trim();
  if (!txt || !pacienteAtivo) return;

  var dataHora = new Date().toLocaleString('pt-BR');
  if (!pacienteAtivo.evolucoes) pacienteAtivo.evolucoes = [];
  pacienteAtivo.evolucoes.unshift({
    id: Date.now(),
    autor: usuarioLogado.nome,
    cargo: usuarioLogado.perfil + " (" + usuarioLogado.registro + ")",
    dataHora: dataHora,
    texto: txt
  });

  fecharModalEvolucao();
  renderizarEvolucoes();
}

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', function() {
  verificarAutenticacao();
  renderizarPacientes();
  renderizarEstoque();
  renderizarEquipe();
});

// --- DEFINIÇÃO DOS MÓDULOS PARA A MATRIZ DE LIBERAÇÃO ---
// Nota: O módulo POP não faz parte da matriz pois é exclusivo do Administrador.
var MODULOS_SISTEMA = [
  { chave: "pacientes", rotulo: "Pacientes (Cadastro / Prontuários)" },
  { chave: "evolucoes", rotulo: "Prontuário (Evoluções Clínicas)" },
  { chave: "prescricao", rotulo: "Prescrição Médica" },
  { chave: "procedimentos", rotulo: "Procedimentos & Checagem" },
  { chave: "estoque", rotulo: "Estoque & Insumos Clínicos" },
  { chave: "agenda", rotulo: "Agenda de Atendimentos" },
  { chave: "nutricao", rotulo: "Nutrição & TACO / Substituições" }
];

function gerarPermissoesPadrao(valorBooleano) {
  var perms = {};
  MODULOS_SISTEMA.forEach(function(m) {
    perms[m.chave] = {
      ver: valorBooleano,
      adicionar: valorBooleano,
      editar: valorBooleano,
      excluir: valorBooleano
    };
  });
  return perms;
}

// --- BANCO DE USUÁRIOS (APENAS O ADM POR PADRÃO) ---
var usuariosSistema = [
  {
    id: 1,
    nome: "Administrador Geral",
    email: "admin@leveh.com.br",
    senha: "admin123",
    perfil: "Administrador",
    registro: "ADM-01",
    status: "Ativo",
    permissoes: gerarPermissoesPadrao(true)
  }
];

// Carrega usuários persistidos
try {
  var dadosPersistidos = localStorage.getItem('leveh_usuarios_bd_v3');
  if (dadosPersistidos) {
    usuariosSistema = JSON.parse(dadosPersistidos);
  }
} catch (e) {}

function salvarUsuariosNoStorage() {
  localStorage.setItem('leveh_usuarios_bd_v3', JSON.stringify(usuariosSistema));
}

// Usuário ativo na sessão
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
        cargo: "Administrador",
        dataHora: "10/10/2026, 22:51:38",
        texto: "Paciente comparece para retorno clínico com boa evolução."
      }
    ],
    prescricoesMedicas: [
      {
        id: 201,
        autor: "Dr. Responsável",
        cargo: "Médico Assistencial",
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

// --- FUNÇÃO AUXILIAR DE VERIFICAÇÃO DE PERMISSÃO ---
function temPermissao(modulo, acao) {
  if (usuarioLogado.perfil === "Administrador") return true;
  if (!usuarioLogado.permissoes || !usuarioLogado.permissoes[modulo]) return false;
  return !!usuarioLogado.permissoes[modulo][acao];
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
      atualizarInterfacePorPermissoes();
      return;
    }
  }

  if (modal) modal.style.display = 'flex';
  atualizarInterfacePorPermissoes();
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
      fb.innerText = "Esta conta de colaborador está desativada pela administração.";
      fb.style.display = 'block';
    }
    return false;
  }

  if (user.senha === senha) {
    usuarioLogado = user;
    localStorage.setItem('leveh_email_sessao', user.email);

    var modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';

    atualizarInterfacePorPermissoes();
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

function atualizarInterfacePorPermissoes() {
  var b = document.getElementById('badgePerfilAtivo');
  if (b) b.innerText = usuarioLogado.nome + " — " + usuarioLogado.perfil + " (" + usuarioLogado.registro + ")";

  // Módulo POP: Visível EXCLUSIVAMENTE para o Administrador
  var navPop = document.getElementById('nav-pop');
  if (navPop) {
    navPop.style.display = (usuarioLogado.perfil === 'Administrador') ? 'flex' : 'none';
  }

  // Módulo Equipe: Visível EXCLUSIVAMENTE para o Administrador
  var navEquipe = document.getElementById('nav-equipe');
  if (navEquipe) {
    navEquipe.style.display = (usuarioLogado.perfil === 'Administrador') ? 'flex' : 'none';
  }

  // Botões de Adicionar de acordo com as permissões
  var btnNovoPaciente = document.getElementById('btnNovoPaciente');
  if (btnNovoPaciente) btnNovoPaciente.style.display = temPermissao('pacientes', 'adicionar') ? 'inline-flex' : 'none';

  var btnNovaEvolucao = document.getElementById('btnNovaEvolucao');
  if (btnNovaEvolucao) btnNovaEvolucao.style.display = temPermissao('evolucoes', 'adicionar') ? 'inline-flex' : 'none';

  var btnAbrirPrescricao = document.getElementById('btnAbrirPrescricao');
  if (btnAbrirPrescricao) btnAbrirPrescricao.style.display = temPermissao('prescricao', 'adicionar') ? 'inline-flex' : 'none';

  var btnNovoProcedimento = document.getElementById('btnNovoProcedimento');
  if (btnNovoProcedimento) btnNovoProcedimento.style.display = temPermissao('procedimentos', 'adicionar') ? 'inline-flex' : 'none';

  var btnNovoProdutoEstoque = document.getElementById('btnNovoProdutoEstoque');
  if (btnNovoProdutoEstoque) btnNovoProdutoEstoque.style.display = temPermissao('estoque', 'adicionar') ? 'inline-flex' : 'none';
}

// --- MODAL DE TROCA DE SENHA DO PRÓPRIO USUÁRIO ---
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
  alert("Senha atualizada com sucesso!");
}

// --- GESTÃO DE EQUIPE & MATRIZ DE PERMISSÕES ---
function renderizarTabelaMatrizPermissoes(permissoesObj) {
  var tbody = document.getElementById('corpoMatrizPermissoes');
  if (!tbody) return;

  tbody.innerHTML = MODULOS_SISTEMA.map(function(m) {
    var p = (permissoesObj && permissoesObj[m.chave]) ? permissoesObj[m.chave] : { ver: false, adicionar: false, editar: false, excluir: false };
    return '<tr>' +
      '<td style="padding:8px 10px;"><strong>' + m.rotulo + '</strong></td>' +
      '<td style="text-align:center;"><input type="checkbox" class="chk-perm" data-modulo="' + m.chave + '" data-acao="ver" ' + (p.ver ? 'checked' : '') + '></td>' +
      '<td style="text-align:center;"><input type="checkbox" class="chk-perm" data-modulo="' + m.chave + '" data-acao="adicionar" ' + (p.adicionar ? 'checked' : '') + '></td>' +
      '<td style="text-align:center;"><input type="checkbox" class="chk-perm" data-modulo="' + m.chave + '" data-acao="editar" ' + (p.editar ? 'checked' : '') + '></td>' +
      '<td style="text-align:center;"><input type="checkbox" class="chk-perm" data-modulo="' + m.chave + '" data-acao="excluir" ' + (p.excluir ? 'checked' : '') + '></td>' +
    '</tr>';
  }).join('');
}

function marcarTodasPermissoes(marcar) {
  document.querySelectorAll('.chk-perm').forEach(function(chk) {
    chk.checked = !!marcar;
  });
}

function aoMudarFuncaoHospitalar() {
  // Ajuste automático das permissões sugeridas ao trocar o perfil
  var perfil = document.getElementById('colabPerfil').value;
  var sugeridas = gerarPermissoesPadrao(false);

  if (perfil === "Administrador") {
    sugeridas = gerarPermissoesPadrao(true);
  } else if (perfil === "Medico") {
    sugeridas.pacientes = { ver: true, adicionar: true, editar: true, excluir: false };
    sugeridas.evolucoes = { ver: true, adicionar: true, editar: true, excluir: false };
    sugeridas.prescricao = { ver: true, adicionar: true, editar: true, excluir: true };
    sugeridas.procedimentos = { ver: true, adicionar: true, editar: true, excluir: false };
    sugeridas.estoque = { ver: true, adicionar: false, editar: false, excluir: false };
    sugeridas.agenda = { ver: true, adicionar: true, editar: true, excluir: false };
    sugeridas.nutricao = { ver: true, adicionar: false, editar: false, excluir: false };
  } else if (perfil === "Enfermeiro" || perfil === "TecnicoEnfermagem") {
    sugeridas.pacientes = { ver: true, adicionar: false, editar: false, excluir: false };
    sugeridas.evolucoes = { ver: true, adicionar: true, editar: false, excluir: false };
    sugeridas.prescricao = { ver: true, adicionar: false, editar: false, excluir: false };
    sugeridas.procedimentos = { ver: true, adicionar: true, editar: true, excluir: false };
    sugeridas.estoque = { ver: true, adicionar: false, editar: true, excluir: false };
    sugeridas.agenda = { ver: true, adicionar: false, editar: false, excluir: false };
  } else if (perfil === "Farmaceutico") {
    sugeridas.estoque = { ver: true, adicionar: true, editar: true, excluir: true };
    sugeridas.prescricao = { ver: true, adicionar: false, editar: false, excluir: false };
  } else if (perfil === "Nutricionista") {
    sugeridas.pacientes = { ver: true, adicionar: true, editar: true, excluir: false };
    sugeridas.evolucoes = { ver: true, adicionar: true, editar: true, excluir: false };
    sugeridas.nutricao = { ver: true, adicionar: true, editar: true, excluir: true };
  } else if (perfil === "Recepcao") {
    sugeridas.pacientes = { ver: true, adicionar: true, editar: true, excluir: false };
    sugeridas.agenda = { ver: true, adicionar: true, editar: true, excluir: true };
  }

  renderizarTabelaMatrizPermissoes(sugeridas);
}

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

  var permsIniciais = gerarPermissoesPadrao(false);

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
      document.getElementById('modalColabTitulo').innerText = "Editar Funcionário & Liberações — " + u.nome;
      document.getElementById('btnSalvarColab').innerText = "Gravar Alterações";
      permsIniciais = u.permissoes || gerarPermissoesPadrao(false);
    }
  } else {
    aoMudarFuncaoHospitalar();
    document.getElementById('modalColaborador').style.display = 'flex';
    return;
  }

  renderizarTabelaMatrizPermissoes(permsIniciais);
  document.getElementById('modalColaborador').style.display = 'flex';
}

function fecharModalColaborador() {
  document.getElementById('modalColaborador').style.display = 'none';
}

function coletarPermissoesDoFormulario() {
  var perms = {};
  MODULOS_SISTEMA.forEach(function(m) {
    perms[m.chave] = { ver: false, adicionar: false, editar: false, excluir: false };
  });

  document.querySelectorAll('.chk-perm').forEach(function(chk) {
    var mod = chk.getAttribute('data-modulo');
    var acao = chk.getAttribute('data-acao');
    if (perms[mod] && chk.checked) {
      perms[mod][acao] = true;
    }
  });

  return perms;
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
  var permissoes = coletarPermissoesDoFormulario();

  if (id) {
    var idx = usuariosSistema.findIndex(function(u) { return u.id == id; });
    if (idx !== -1) {
      usuariosSistema[idx].nome = nome;
      usuariosSistema[idx].perfil = perfil;
      usuariosSistema[idx].email = email;
      usuariosSistema[idx].registro = registro;
      usuariosSistema[idx].senha = senha;
      usuariosSistema[idx].status = status;
      usuariosSistema[idx].permissoes = permissoes;
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
      status: status,
      permissoes: permissoes
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

function excluirColaborador(id) {
  if (usuarioLogado.perfil !== 'Administrador') {
    alert("Apenas o Administrador pode excluir contas.");
    return;
  }
  if (id === 1) {
    alert("A conta do Administrador Geral não pode ser excluída.");
    return;
  }
  var u = usuariosSistema.find(function(item) { return item.id === id; });
  if (!u) return;

  if (confirm("Deseja realmente excluir permanentemente a conta de " + u.nome + "?")) {
    usuariosSistema = usuariosSistema.filter(function(item) { return item.id !== id; });
    salvarUsuariosNoStorage();
    renderizarEquipe();
  }
}

function renderizarEquipe() {
  var tbody = document.getElementById('listaEquipeCorpo');
  if (!tbody) return;

  tbody.innerHTML = usuariosSistema.map(function(u) {
    var badgeStatus = '<span class="status-badge-checagem status-executado">Ativo</span>';
    if (u.status === "Inativo") {
      badgeStatus = '<span class="status-badge-checagem status-pendente">Inativo</span>';
    }

    // Resumo de permissões liberadas
    var totalLiberadas = 0;
    if (u.permissoes) {
      Object.keys(u.permissoes).forEach(function(k) {
        if (u.permissoes[k].ver) totalLiberadas++;
        if (u.permissoes[k].adicionar) totalLiberadas++;
        if (u.permissoes[k].editar) totalLiberadas++;
        if (u.permissoes[k].excluir) totalLiberadas++;
      });
    }

    return '<tr>' +
      '<td><code>FUNC-0' + u.id + '</code></td>' +
      '<td><strong>' + u.nome + '</strong></td>' +
      '<td>' + u.email + '</td>' +
      '<td><span class="badge-role">' + u.perfil + '</span></td>' +
      '<td>' + u.registro + '</td>' +
      '<td><small style="color:var(--text-muted);">' + (u.perfil === "Administrador" ? "Acesso Total (Irrestrito)" : (totalLiberadas + " permissões ativas")) + '</small></td>' +
      '<td>' + badgeStatus + '</td>' +
      '<td>' +
        '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
          '<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" type="button" onclick="abrirModalColaborador(' + u.id + ')">✏️ Liberações / Editar</button>' +
          (u.id !== 1 ? '<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" type="button" onclick="alternarStatusColaborador(' + u.id + ')">' + (u.status === "Ativo" ? "Desativar" : "Ativar") + '</button>' : '') +
          (u.id !== 1 ? '<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#b91c1c; border-color:#fca5a5;" type="button" onclick="excluirColaborador(' + u.id + ')">🗑️ Excluir</button>' : '') +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');
}

// --- PACIENTES ---
function abrirModalNovoPaciente() {
  if (!temPermissao('pacientes', 'adicionar')) {
    alert("Acesso Negado: Você não tem permissão para adicionar novos pacientes.");
    return;
  }
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
  if (!temPermissao('pacientes', 'editar')) {
    alert("Acesso Negado: Você não tem permissão para editar os dados cadastrais deste paciente.");
    return;
  }
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

function excluirPaciente(id) {
  if (!temPermissao('pacientes', 'excluir')) {
    alert("Acesso Negado: Você não tem permissão para excluir prontuários de pacientes.");
    return;
  }
  var p = bancoPacientes.find(function(item) { return item.id === id; });
  if (!p) return;

  if (confirm("Deseja realmente excluir o prontuário de " + p.nome + " (" + p.prontuario + ")? Esta ação é irreversível.")) {
    bancoPacientes = bancoPacientes.filter(function(item) { return item.id !== id; });
    renderizarPacientes();
  }
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
    var podeEditar = temPermissao('pacientes', 'editar');
    var podeExcluir = temPermissao('pacientes', 'excluir');

    return '<tr>' +
      '<td><strong>' + p.prontuario + '</strong></td>' +
      '<td><strong>' + p.nome + '</strong></td>' +
      '<td>' + calcularIdade(p.nascimento) + '</td>' +
      '<td>' + (p.sexo || '-') + '</td>' +
      '<td>' + (p.convenio || 'Particular') + '</td>' +
      '<td>' + (p.telefone || '-') + '</td>' +
      '<td><div style="display:flex; gap:6px;">' +
        '<button class="btn btn-primary" style="padding:4px 8px; font-size:0.75rem;" type="button" onclick="abrirProntuario(' + p.id + ')">📋 Prontuário</button>' +
        (podeEditar ? '<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" type="button" onclick="abrirModalEdicaoPaciente(' + p.id + ')">✏️ Editar</button>' : '') +
        (podeExcluir ? '<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#b91c1c; border-color:#fca5a5;" type="button" onclick="excluirPaciente(' + p.id + ')">🗑️</button>' : '') +
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
    inicializarMiniCalendarioPrescricao();
    renderizarChecagemPrescricao();
    renderizarProcedimentos();
  } else if (abaId === 'aba-prescricao-medica') {
    renderizarPrescricoesMedicas();
  } else if (abaId === 'aba-antropometria') {
    renderizarModuloAntropometria();
  } else if (abaId === 'aba-exames') {
    renderizarPainelComparativoExames();
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
  renderizarPainelComparativoExames();
  renderizarModuloAntropometria();
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
  // Verificação de permissão do POP: estritamente Administrador
  if (moduloId === 'pop' && usuarioLogado.perfil !== 'Administrador') {
    alert("Acesso Negado: O módulo POP é homologado estritamente para a Diretoria Clínica e Administrador.");
    return;
  }

  // Verificação de permissão da Equipe: estritamente Administrador
  if (moduloId === 'equipe' && usuarioLogado.perfil !== 'Administrador') {
    alert("Acesso Negado: Gestão de equipe é exclusiva do Administrador.");
    return;
  }

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
    equipe: "Equipe Hospitalar & Liberações",
    taco: "Tabela TACO",
    substituicao: "Listas de Substituição",
    pop: "POP (Diretoria Clínica)"
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
    box.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:14px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border);">Nenhuma anotação registrada.</div>';
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
  if (!temPermissao('prescricao', 'adicionar')) {
    alert("Acesso Negado: Você não tem permissão para emitir prescrições médicas.");
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

function excluirPrescricaoMedica(prescId) {
  if (!temPermissao('prescricao', 'excluir')) {
    alert("Acesso Negado: Você não tem permissão para excluir prescrições médicas.");
    return;
  }
  if (confirm("Deseja realmente excluir esta prescrição médica emitida?")) {
    pacienteAtivo.prescricoesMedicas = pacienteAtivo.prescricoesMedicas.filter(function(p) { return p.id !== prescId; });
    renderizarPrescricoesMedicas();
    renderizarChecagemPrescricao();
  }
}

function renderizarPrescricoesMedicas() {
  var box = document.getElementById('historicoPrescricoesMedicas');
  if (!box) return;
  if (!pacienteAtivo || !pacienteAtivo.prescricoesMedicas || pacienteAtivo.prescricoesMedicas.length === 0) {
    box.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:14px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border);">Nenhuma prescrição ativa.</div>';
    return;
  }

  var podeExcluir = temPermissao('prescricao', 'excluir');

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
        '<div style="display:flex; align-items:center; gap:8px;">' +
          '<span class="evolucao-datahora">📅 Emitida em: ' + pr.dataHora + '</span>' +
          (podeExcluir ? '<button class="btn btn-outline" style="padding:2px 6px; font-size:0.72rem; color:#b91c1c; border-color:#fca5a5;" onclick="excluirPrescricaoMedica(' + pr.id + ')">🗑️</button>' : '') +
        '</div>' +
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

// --- CONTROLE DE DATA DO MINI CALENDÁRIO DA PRESCRIÇÃO ---
var dataPrescricaoFiltro = new Date().toISOString().split('T')[0];

function obterDataFormatadaISO(dataObj) {
  var d = new Date(dataObj);
  var mes = '' + (d.getMonth() + 1);
  var dia = '' + d.getDate();
  var ano = d.getFullYear();
  if (mes.length < 2) mes = '0' + mes;
  if (dia.length < 2) dia = '0' + dia;
  return [ano, mes, dia].join('-');
}

function inicializarMiniCalendarioPrescricao() {
  var input = document.getElementById('filtroDataPrescricao');
  if (input && !input.value) {
    dataPrescricaoFiltro = obterDataFormatadaISO(new Date());
    input.value = dataPrescricaoFiltro;
  }
  atualizarBadgeDataPrescricao();
}

function atualizarBadgeDataPrescricao() {
  var badge = document.getElementById('resumoDataPrescricaoBadge');
  if (!badge) return;
  var partes = dataPrescricaoFiltro.split('-');
  if (partes.length === 3) {
    badge.innerText = "Exibindo prescrições de: " + partes[2] + "/" + partes[1] + "/" + partes[0];
  }
}

function aoMudarDataPrescricao() {
  var input = document.getElementById('filtroDataPrescricao');
  if (input && input.value) {
    dataPrescricaoFiltro = input.value;
    atualizarBadgeDataPrescricao();
    renderizarChecagemPrescricao();
    renderizarProcedimentos();
  }
}

function navegarDataPrescricao(dias) {
  var partes = dataPrescricaoFiltro.split('-');
  var dt = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
  dt.setDate(dt.getDate() + dias);
  dataPrescricaoFiltro = obterDataFormatadaISO(dt);
  var input = document.getElementById('filtroDataPrescricao');
  if (input) input.value = dataPrescricaoFiltro;
  atualizarBadgeDataPrescricao();
  renderizarChecagemPrescricao();
  renderizarProcedimentos();
}

function definirDataPrescricaoHoje() {
  dataPrescricaoFiltro = obterDataFormatadaISO(new Date());
  var input = document.getElementById('filtroDataPrescricao');
  if (input) input.value = dataPrescricaoFiltro;
  atualizarBadgeDataPrescricao();
  renderizarChecagemPrescricao();
  renderizarProcedimentos();
}

// --- CHECAGEM ---
function renderizarChecagemPrescricao() {
  var container = document.getElementById('listaChecagemPrescricao');
  if (!container) return;

  inicializarMiniCalendarioPrescricao();

  if (!pacienteAtivo || !pacienteAtivo.prescricoesMedicas || pacienteAtivo.prescricoesMedicas.length === 0) {
    container.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:12px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border);">Nenhuma prescrição médica cadastrada para este paciente.</div>';
    return;
  }

  // Converte a data do calendário (YYYY-MM-DD) para formato BR (DD/MM/YYYY)
  var partesFiltro = dataPrescricaoFiltro.split('-');
  var dataFiltroBR = partesFiltro[2] + "/" + partesFiltro[1] + "/" + partesFiltro[0];

  // Filtra as prescrições médicas criadas no dia selecionado
  var prescricoesDoDia = pacienteAtivo.prescricoesMedicas.filter(function(p) {
    return p.dataHora && p.dataHora.indexOf(dataFiltroBR) !== -1;
  });

  if (prescricoesDoDia.length === 0) {
    container.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:12px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border);">Nenhuma prescrição médica criada nesta data (' + dataFiltroBR + '). Utilize os botões do calendário acima para navegar entre os dias.</div>';
    return;
  }

  var podeChecar = temPermissao('procedimentos', 'adicionar') || temPermissao('procedimentos', 'editar');

  var todosItens = [];
  prescricoesDoDia.forEach(function(presc) {
    presc.itens.forEach(function(item) {
      todosItens.push(Object.assign({}, item, { prescId: presc.id, medico: presc.autor, horaCriacao: presc.dataHora }));
    });
  });

  container.innerHTML = todosItens.map(function(it) {
    return '<div class="item-checagem-card ' + (it.checado ? 'checado' : '') + '">' +
      '<div class="item-checagem-info">' +
        '<strong>💊 ' + it.medicamento + ' — ' + it.dose + ' (' + it.via + ')</strong>' +
        '<span>Posologia: ' + it.posologia + ' | Prescrito por: ' + it.medico + ' (Criada em: ' + it.horaCriacao + ')</span>' +
        '<div><span class="status-badge-checagem ' + (it.checado ? 'status-executado' : 'status-pendente') + '">' +
          (it.checado ? ('✓ Executado: ' + it.checadoPor + ' às ' + it.checadoEm) : '⏳ Pendente de Checagem') +
        '</span></div>' +
      '</div>' +
      '<div>' +
        (it.checado ?
          '<button class="btn btn-outline" style="padding:5px 10px; font-size:0.75rem;" disabled>✓ Já Administrado</button>' :
          (podeChecar ?
            '<button class="btn-checar" type="button" onclick="abrirModalChecagem(' + it.prescId + ', ' + it.id + ')">✓ Checar / Executar</button>' :
            '<span style="font-size:0.75rem; color:var(--text-muted);">Sem permissão para checar</span>'
          )
        ) +
      '</div>' +
    '</div>';
  }).join('');
}

var contadorInsumosChecagem = 0;

function abrirModalChecagem(prescId, itemId) {
  if (!temPermissao('procedimentos', 'adicionar') && !temPermissao('procedimentos', 'editar')) {
    alert("Acesso Negado: Você não tem permissão para executar checagens de medicação.");
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

// --- PROCEDIMENTOS AVULSOS ---
var contadorInsumosProcAvulso = 0;

function abrirModalProcedimentoAvulso() {
  if (!temPermissao('procedimentos', 'adicionar')) {
    alert("Acesso Negado: Você não tem permissão para registrar procedimentos avulsos.");
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

function renderizarProcedimentos() {
  var box = document.getElementById('historicoProcedimentos');
  if (!box) return;
  if (!pacienteAtivo || !pacienteAtivo.procedimentos || pacienteAtivo.procedimentos.length === 0) {
    box.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:14px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border);">Nenhum procedimento registrado.</div>';
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

// --- PRODUTOS DO ESTOQUE ---
function abrirModalProdutoSanitario(cod) {
  if (cod && !temPermissao('estoque', 'editar')) {
    alert("Acesso Negado: Você não tem permissão para editar insumos no estoque.");
    return;
  }
  if (!cod && !temPermissao('estoque', 'adicionar')) {
    alert("Acesso Negado: Você não tem permissão para cadastrar novos produtos no estoque.");
    return;
  }

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

  document.getElementById('modalProdutoSanitario').style.display = "flex";
}

function fecharModalProdutoSanitario() {
  document.getElementById('modalProdutoSanitario').style.display = "none";
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

function excluirProdutoEstoque(cod) {
  if (!temPermissao('estoque', 'excluir')) {
    alert("Acesso Negado: Você não tem permissão para excluir produtos do estoque.");
    return;
  }
  var p = estoqueInsumos.find(function(i) { return i.cod === cod; });
  if (!p) return;

  if (confirm("Deseja realmente remover o produto " + p.nome + " (" + p.cod + ") do catálogo de estoque?")) {
    estoqueInsumos = estoqueInsumos.filter(function(i) { return i.cod !== cod; });
    renderizarEstoque();
  }
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

  var podeEditar = temPermissao('estoque', 'editar');
  var podeExcluir = temPermissao('estoque', 'excluir');

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
      '<td><div style="display:flex; gap:4px;">' +
        (podeEditar ? '<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem;" type="button" onclick="abrirModalProdutoSanitario(\'' + item.cod + '\')">✏️</button>' : '') +
        (podeExcluir ? '<button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#b91c1c; border-color:#fca5a5;" type="button" onclick="excluirProdutoEstoque(\'' + item.cod + '\')">🗑️</button>' : '') +
      '</div></td>' +
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

// --- LANÇAMENTO GENÉRICO POR ABA (ANTROPOMETRIA, BIOIMPEDÂNCIA, DIETAS) ---

// --- MÓDULO ANTROPOMETRIA CLÍNICA & ESPORTIVA ---

function abrirModalAntropometria() {
  if (!temPermissao('nutricao', 'adicionar')) {
    alert("Acesso Negado: Você não tem permissão para adicionar avaliações antropométricas.");
    return;
  }

  var form = document.getElementById('formAntropometria');
  if (form) form.reset();

  if (pacienteAtivo) {
    document.getElementById('modalAntropoSubinfo').innerText = "Paciente: " + pacienteAtivo.nome + " (" + pacienteAtivo.prontuario + ")";
  }

  // Zera prévias de cálculo
  document.getElementById('previewIMC').innerText = "--";
  document.getElementById('previewBF').innerText = "--";
  document.getElementById('previewMassaMagra').innerText = "--";
  document.getElementById('previewMassaGorda').innerText = "--";
  document.getElementById('previewRCQ').innerText = "--";
  document.getElementById('previewTMB').innerText = "--";
  document.getElementById('antropoSomaDobras').value = "--";

  document.getElementById('modalAntropometria').style.display = 'flex';
}

function fecharModalAntropometria() {
  document.getElementById('modalAntropometria').style.display = 'none';
}

function calcularMetricasAntropoAoVivo() {
  var peso = parseFloat(document.getElementById('antropoPeso').value) || 0;
  var alturaCm = parseFloat(document.getElementById('antropoAltura').value) || 0;
  var cintura = parseFloat(document.getElementById('antropoCintura').value) || 0;
  var quadril = parseFloat(document.getElementById('antropoQuadril').value) || 0;

  var tri = parseFloat(document.getElementById('antropoTriceps').value) || 0;
  var sub = parseFloat(document.getElementById('antropoSubescapular').value) || 0;
  var peit = parseFloat(document.getElementById('antropoPeitoral').value) || 0;
  var ax = parseFloat(document.getElementById('antropoAxilar').value) || 0;
  var sup = parseFloat(document.getElementById('antropoSuprailiaca').value) || 0;
  var abd = parseFloat(document.getElementById('antropoDobraAbdomen').value) || 0;
  var cox = parseFloat(document.getElementById('antropoDobraCoxa').value) || 0;

  // 1. IMC
  var imc = 0;
  if (peso > 0 && alturaCm > 0) {
    var alturaM = alturaCm / 100;
    imc = peso / (alturaM * alturaM);
    document.getElementById('previewIMC').innerText = imc.toFixed(1) + " kg/m²";
  } else {
    document.getElementById('previewIMC').innerText = "--";
  }

  // 2. RCQ
  if (cintura > 0 && quadril > 0) {
    var rcq = cintura / quadril;
    document.getElementById('previewRCQ').innerText = rcq.toFixed(2);
  } else {
    document.getElementById('previewRCQ').innerText = "--";
  }

  // 3. Pollock 7 Dobras
  var somaDobras = tri + sub + peit + ax + sup + abd + cox;
  document.getElementById('antropoSomaDobras').value = somaDobras > 0 ? somaDobras.toFixed(1) + " mm" : "--";

  var idadeNum = 30;
  if (pacienteAtivo && pacienteAtivo.nascimento) {
    var idadeTexto = calcularIdade(pacienteAtivo.nascimento);
    var parseada = parseInt(idadeTexto);
    if (!isNaN(parseada)) idadeNum = parseada;
  }
  var sexo = (pacienteAtivo && pacienteAtivo.sexo === 'M') ? 'M' : 'F';

  var percGordura = 0;
  if (somaDobras > 0 && peso > 0) {
    var densidade = 0;
    if (sexo === 'M') {
      densidade = 1.112 - (0.00043499 * somaDobras) + (0.00000055 * (somaDobras * somaDobras)) - (0.00028826 * idadeNum);
    } else {
      densidade = 1.097 - (0.00046971 * somaDobras) + (0.00000056 * (somaDobras * somaDobras)) - (0.00012828 * idadeNum);
    }
    percGordura = ((4.95 / densidade) - 4.5) * 100;
    if (percGordura < 3) percGordura = 3;
    if (percGordura > 60) percGordura = 60;

    var massaGordaKg = peso * (percGordura / 100);
    var massaMagraKg = peso - massaGordaKg;
    var tmbKatch = 370 + (21.6 * massaMagraKg);

    document.getElementById('previewBF').innerText = percGordura.toFixed(1) + "%";
    document.getElementById('previewMassaGorda').innerText = massaGordaKg.toFixed(1) + " kg";
    document.getElementById('previewMassaMagra').innerText = massaMagraKg.toFixed(1) + " kg";
    document.getElementById('previewTMB').innerText = Math.round(tmbKatch) + " kcal";
  } else {
    document.getElementById('previewBF').innerText = "--";
    document.getElementById('previewMassaGorda').innerText = "--";
    document.getElementById('previewMassaMagra').innerText = "--";
    document.getElementById('previewTMB').innerText = "--";
  }
}

function salvarAvaliacaoAntropometrica(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (!pacienteAtivo) return false;

  var peso = parseFloat(document.getElementById('antropoPeso').value) || 0;
  var alturaCm = parseFloat(document.getElementById('antropoAltura').value) || 0;
  var envergadura = parseFloat(document.getElementById('antropoEnvergadura').value) || 0;

  var cintura = parseFloat(document.getElementById('antropoCintura').value) || 0;
  var abdomen = parseFloat(document.getElementById('antropoAbdomen').value) || 0;
  var quadril = parseFloat(document.getElementById('antropoQuadril').value) || 0;
  var torax = parseFloat(document.getElementById('antropoTorax').value) || 0;
  var bracoRel = parseFloat(document.getElementById('antropoBracoRelax').value) || 0;
  var bracoContr = parseFloat(document.getElementById('antropoBracoContr').value) || 0;
  var coxaMed = parseFloat(document.getElementById('antropoCoxaMed').value) || 0;
  var panturrilha = parseFloat(document.getElementById('antropoPanturrilha').value) || 0;

  var tri = parseFloat(document.getElementById('antropoTriceps').value) || 0;
  var sub = parseFloat(document.getElementById('antropoSubescapular').value) || 0;
  var peit = parseFloat(document.getElementById('antropoPeitoral').value) || 0;
  var ax = parseFloat(document.getElementById('antropoAxilar').value) || 0;
  var sup = parseFloat(document.getElementById('antropoSuprailiaca').value) || 0;
  var abdDobra = parseFloat(document.getElementById('antropoDobraAbdomen').value) || 0;
  var coxDobra = parseFloat(document.getElementById('antropoDobraCoxa').value) || 0;
  var parecer = document.getElementById('antropoParecer').value.trim();

  var alturaM = alturaCm / 100;
  var imc = (peso > 0 && alturaM > 0) ? (peso / (alturaM * alturaM)) : 0;
  var rcq = (cintura > 0 && quadril > 0) ? (cintura / quadril) : 0;

  var somaDobras = tri + sub + peit + ax + sup + abdDobra + coxDobra;
  var idadeNum = 30;
  if (pacienteAtivo.nascimento) {
    var idadeTexto = calcularIdade(pacienteAtivo.nascimento);
    var pId = parseInt(idadeTexto);
    if (!isNaN(pId)) idadeNum = pId;
  }
  var sexo = pacienteAtivo.sexo === 'M' ? 'M' : 'F';

  var percGordura = 0;
  var massaMagra = 0;
  var massaGorda = 0;
  var tmb = 0;

  if (somaDobras > 0 && peso > 0) {
    var densidade = (sexo === 'M')
      ? 1.112 - (0.00043499 * somaDobras) + (0.00000055 * (somaDobras * somaDobras)) - (0.00028826 * idadeNum)
      : 1.097 - (0.00046971 * somaDobras) + (0.00000056 * (somaDobras * somaDobras)) - (0.00012828 * idadeNum);
    percGordura = Math.max(3, Math.min(60, ((4.95 / densidade) - 4.5) * 100));
    massaGorda = peso * (percGordura / 100);
    massaMagra = peso - massaGorda;
    tmb = Math.round(370 + (21.6 * massaMagra));
  }

  var novaAvaliacao = {
    id: Date.now(),
    dataHora: new Date().toLocaleString('pt-BR'),
    autor: usuarioLogado.nome,
    cargo: usuarioLogado.perfil + " (" + usuarioLogado.registro + ")",
    peso: peso,
    altura: alturaCm,
    envergadura: envergadura,
    imc: imc,
    rcq: rcq,
    cintura: cintura,
    abdomen: abdomen,
    quadril: quadril,
    torax: torax,
    bracoRel: bracoRel,
    bracoContr: bracoContr,
    coxaMed: coxaMed,
    panturrilha: panturrilha,
    somaDobras: somaDobras,
    bf: percGordura,
    massaMagra: massaMagra,
    massaGorda: massaGorda,
    tmb: tmb,
    parecer: parecer
  };

  if (!pacienteAtivo.antropometria) pacienteAtivo.antropometria = [];
  pacienteAtivo.antropometria.unshift(novaAvaliacao);

  fecharModalAntropometria();
  renderizarModuloAntropometria();
  return false;
}

function renderizarModuloAntropometria() {
  var painel = document.getElementById('painelComparativoAntropo');
  var historico = document.getElementById('historicoAntropometria');
  if (!painel || !historico) return;

  if (!pacienteAtivo || !pacienteAtivo.antropometria || pacienteAtivo.antropometria.length === 0) {
    painel.innerHTML = "";
    historico.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:16px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border);">Nenhuma medição antropométrica registrada. Clique em <strong>+ Nova Medição</strong> acima.</div>';
    return;
  }

  var avaliacoes = pacienteAtivo.antropometria;
  var atual = avaliacoes[0];
  var anterior = avaliacoes.length > 1 ? avaliacoes[1] : null;

  // Função auxiliar para badge de variação Delta (Δ)
  function badgeDelta(valAtual, valAnt, unidade, inverterCores) {
    if (!anterior || valAnt === 0 || typeof valAnt === 'undefined') return '';
    var diff = valAtual - valAnt;
    if (Math.abs(diff) < 0.05) return '<span style="font-size:0.75rem; color:#6b7280; margin-left:4px;">(0.0)</span>';
    var positivo = diff > 0;
    var cor = (positivo && !inverterCores) || (!positivo && inverterCores) ? '#15803d' : '#b91c1c';
    var sinal = positivo ? '+' : '';
    return '<span style="font-size:0.75rem; font-weight:700; color:' + cor + '; margin-left:4px;">(' + sinal + diff.toFixed(1) + unidade + ')</span>';
  }

  // 1. Painel Comparativo Evolutivo (Atual vs Anterior)
  painel.innerHTML = '<div style="background:#ffffff; border:1px solid #cce2d3; border-radius:10px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.03);">' +
    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid var(--border); padding-bottom:8px;">' +
      '<strong style="font-size:0.92rem; color:var(--primary);">📊 Comparativo Evolutivo (Última Avaliação vs Anterior)</strong>' +
      '<span style="font-size:0.78rem; color:var(--text-muted);">' + (anterior ? 'Comparando com ' + anterior.dataHora.split(',')[0] : 'Primeira medição registrada') + '</span>' +
    '</div>' +
    '<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; text-align:center;">' +
      '<div style="background:#f8faf9; padding:8px; border-radius:6px;"><small style="color:var(--text-muted);">Peso</small><div style="font-size:1.05rem; font-weight:700;">' + atual.peso.toFixed(1) + ' kg ' + badgeDelta(atual.peso, anterior ? anterior.peso : 0, 'kg', true) + '</div></div>' +
      '<div style="background:#f8faf9; padding:8px; border-radius:6px;"><small style="color:var(--text-muted);">% Gordura (BF)</small><div style="font-size:1.05rem; font-weight:700; color:#1d4ed8;">' + (atual.bf ? atual.bf.toFixed(1) + '%' : '--') + ' ' + badgeDelta(atual.bf, anterior ? anterior.bf : 0, '%', true) + '</div></div>' +
      '<div style="background:#f8faf9; padding:8px; border-radius:6px;"><small style="color:var(--text-muted);">Massa Magra</small><div style="font-size:1.05rem; font-weight:700; color:#15803d;">' + (atual.massaMagra ? atual.massaMagra.toFixed(1) + ' kg' : '--') + ' ' + badgeDelta(atual.massaMagra, anterior ? anterior.massaMagra : 0, 'kg', false) + '</div></div>' +
      '<div style="background:#f8faf9; padding:8px; border-radius:6px;"><small style="color:var(--text-muted);">Massa Gorda</small><div style="font-size:1.05rem; font-weight:700; color:#b91c1c;">' + (atual.massaGorda ? atual.massaGorda.toFixed(1) + ' kg' : '--') + ' ' + badgeDelta(atual.massaGorda, anterior ? anterior.massaGorda : 0, 'kg', true) + '</div></div>' +
      '<div style="background:#f8faf9; padding:8px; border-radius:6px;"><small style="color:var(--text-muted);">Cintura</small><div style="font-size:1.05rem; font-weight:700;">' + (atual.cintura ? atual.cintura.toFixed(1) + ' cm' : '--') + ' ' + badgeDelta(atual.cintura, anterior ? anterior.cintura : 0, 'cm', true) + '</div></div>' +
      '<div style="background:#f8faf9; padding:8px; border-radius:6px;"><small style="color:var(--text-muted);">Braço Contr.</small><div style="font-size:1.05rem; font-weight:700;">' + (atual.bracoContr ? atual.bracoContr.toFixed(1) + ' cm' : '--') + ' ' + badgeDelta(atual.bracoContr, anterior ? anterior.bracoContr : 0, 'cm', false) + '</div></div>' +
    '</div>' +
  '</div>';

  // 2. Histórico Detalhado em Cards
  historico.innerHTML = avaliacoes.map(function(av) {
    return '<div class="evolucao-card" style="border-left-color:#16a34a; margin-bottom:12px;">' +
      '<div class="evolucao-header">' +
        '<div><span class="evolucao-autor" style="color:#15803d;">' + av.autor + '</span><span class="evolucao-cargo">— ' + av.cargo + '</span></div>' +
        '<span class="evolucao-datahora">📅 ' + av.dataHora + '</span>' +
      '</div>' +
      '<div style="margin-top:10px; font-size:0.86rem; line-height:1.6;">' +
        '<div style="display:flex; flex-wrap:wrap; gap:14px; background:#f9fbf9; padding:10px; border-radius:6px; margin-bottom:8px;">' +
          '<span><strong>Peso:</strong> ' + av.peso.toFixed(1) + ' kg</span>' +
          '<span><strong>Estatura:</strong> ' + av.altura + ' cm</span>' +
          '<span><strong>IMC:</strong> ' + av.imc.toFixed(1) + ' kg/m²</span>' +
          '<span><strong>%BF:</strong> ' + (av.bf ? av.bf.toFixed(1) + '%' : '--') + '</span>' +
          '<span><strong>Massa Magra:</strong> ' + (av.massaMagra ? av.massaMagra.toFixed(1) + ' kg' : '--') + '</span>' +
          '<span><strong>Massa Gorda:</strong> ' + (av.massaGorda ? av.massaGorda.toFixed(1) + ' kg' : '--') + '</span>' +
          '<span><strong>TMB:</strong> ' + (av.tmb ? av.tmb + ' kcal' : '--') + '</span>' +
          '<span><strong>RCQ:</strong> ' + (av.rcq ? av.rcq.toFixed(2) : '--') + '</span>' +
        '</div>' +
        '<div style="font-size:0.82rem; color:var(--text-muted);">' +
          '<strong>Perímetros:</strong> Cintura: ' + (av.cintura || '--') + 'cm | Abdômen: ' + (av.abdomen || '--') + 'cm | Quadril: ' + (av.quadril || '--') + 'cm | Braço Contr.: ' + (av.bracoContr || '--') + 'cm | Coxa Medial: ' + (av.coxaMed || '--') + 'cm | Panturrilha: ' + (av.panturrilha || '--') + 'cm' +
        '</div>' +
        (av.somaDobras ? '<div style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;"><strong>Dobras (Pollock 7):</strong> Somatório de ' + av.somaDobras.toFixed(1) + ' mm</div>' : '') +
        (av.parecer ? '<div style="margin-top:6px; color:var(--text-main);"><strong>Parecer:</strong> ' + av.parecer + '</div>' : '') +
      '</div>' +
    '</div>';
  }).join('');
}

function lancarGenericoAba(abaId) {
  var mapaPermissao = {
    'aba-antropometria': 'nutricao',
    'aba-bioimpedancia': 'nutricao',
    'aba-prescricao': 'nutricao'
  };

  var mod = mapaPermissao[abaId] || 'evolucoes';
  if (!temPermissao(mod, 'adicionar')) {
    alert("Acesso Negado: Você não tem permissão para adicionar avaliações neste módulo.");
    return;
  }

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
  if (!temPermissao('evolucoes', 'adicionar')) {
    alert("Acesso Negado: Você não tem permissão para lançar evoluções clínicas.");
    return;
  }

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

// --- BASE DE DADOS DE REFERÊNCIA LABORATORIAL (CLÍNICA & MEDICINA ESPORTIVA) ---
// --- BASE DE DADOS LABORATORIAL EXPANDIDA (CLÍNICA, HOSPITALAR & ESPORTIVA) ---
var CATALOGO_EXAMES_LAB = [
  // 1. Hematologia / Hemograma Completo
  { id: "hemoglobina", grupo: "Hematologia", nome: "Hemoglobina", unidade: "g/dL", min: 12.0, max: 17.5 },
  { id: "hematocrito", grupo: "Hematologia", nome: "Hematócrito", unidade: "%", min: 36.0, max: 52.0 },
  { id: "hemacias", grupo: "Hematologia", nome: "Hemácias", unidade: "milhões/mm³", min: 4.0, max: 5.9 },
  { id: "vcm", grupo: "Hematologia", nome: "VCM", unidade: "fL", min: 80.0, max: 100.0 },
  { id: "hcm", grupo: "Hematologia", nome: "HCM", unidade: "pg", min: 27.0, max: 33.0 },
  { id: "chcm", grupo: "Hematologia", nome: "CHCM", unidade: "g/dL", min: 32.0, max: 36.0 },
  { id: "rdw", grupo: "Hematologia", nome: "RDW", unidade: "%", min: 11.5, max: 14.5 },
  { id: "leucocitos", grupo: "Hematologia", nome: "Leucócitos Totais", unidade: "/mm³", min: 4000, max: 10000 },
  { id: "neutrofilos", grupo: "Hematologia", nome: "Neutrófilos", unidade: "/mm³", min: 1800, max: 7000 },
  { id: "linfocitos", grupo: "Hematologia", nome: "Linfócitos", unidade: "/mm³", min: 1000, max: 3000 },
  { id: "monocitos", grupo: "Hematologia", nome: "Monócitos", unidade: "/mm³", min: 200, max: 800 },
  { id: "eosinofilos", grupo: "Hematologia", nome: "Eosinófilos", unidade: "/mm³", min: 40, max: 500 },
  { id: "basofilos", grupo: "Hematologia", nome: "Basófilos", unidade: "/mm³", min: 0, max: 100 },
  { id: "plaquetas", grupo: "Hematologia", nome: "Plaquetas", unidade: "/mm³", min: 150000, max: 450000 },

  // 2. Metabolismo Glicídico
  { id: "glicemia", grupo: "Glicemia", nome: "Glicemia de Jejum", unidade: "mg/dL", min: 70, max: 99 },
  { id: "hba1c", grupo: "Glicemia", nome: "Hemoglobina Glicada (HbA1c)", unidade: "%", min: 4.0, max: 5.6 },
  { id: "insulina_jejum", grupo: "Glicemia", nome: "Insulina de Jejum", unidade: "µUI/mL", min: 2.6, max: 24.9 },
  { id: "homa_ir", grupo: "Glicemia", nome: "HOMA-IR", unidade: "índice", min: 0.5, max: 2.15 },
  { id: "homa_beta", grupo: "Glicemia", nome: "HOMA-BETA", unidade: "%", min: 167, max: 176 },

  // 3. Perfil Lipídico
  { id: "colest_total", grupo: "Lipídios", nome: "Colesterol Total", unidade: "mg/dL", min: 0, max: 190 },
  { id: "hdl", grupo: "Lipídios", nome: "Colesterol HDL", unidade: "mg/dL", min: 40, max: 100 },
  { id: "ldl", grupo: "Lipídios", nome: "Colesterol LDL", unidade: "mg/dL", min: 0, max: 100 },
  { id: "vldl", grupo: "Lipídios", nome: "Colesterol VLDL", unidade: "mg/dL", min: 0, max: 30 },
  { id: "nao_hdl", grupo: "Lipídios", nome: "Colesterol Não-HDL", unidade: "mg/dL", min: 0, max: 130 },
  { id: "triglicerideos", grupo: "Lipídios", nome: "Triglicerídeos", unidade: "mg/dL", min: 0, max: 150 },
  { id: "apob", grupo: "Lipídios", nome: "Apolipoproteína B (Apo B)", unidade: "mg/dL", min: 60, max: 110 },
  { id: "apoa1", grupo: "Lipídios", nome: "Apolipoproteína A1 (Apo A1)", unidade: "mg/dL", min: 119, max: 240 },
  { id: "lipoproteina_a", grupo: "Lipídios", nome: "Lipoproteína (a) [Lp(a)]", unidade: "mg/dL", min: 0, max: 30 },

  // 4. Função Renal & Metabólitos
  { id: "creatinina", grupo: "Função Renal", nome: "Creatinina Sérica", unidade: "mg/dL", min: 0.6, max: 1.2 },
  { id: "ureia", grupo: "Função Renal", nome: "Ureia", unidade: "mg/dL", min: 15, max: 45 },
  { id: "tfg", grupo: "Função Renal", nome: "Taxa de Filtração Glomerular (CKD-EPI)", unidade: "mL/min/1.73m²", min: 90, max: 130 },
  { id: "acido_urico", grupo: "Função Renal", nome: "Ácido Úrico", unidade: "mg/dL", min: 2.4, max: 7.0 },
  { id: "cistatina_c", grupo: "Função Renal", nome: "Cistatina C", unidade: "mg/L", min: 0.53, max: 0.95 },

  // 5. Função Hepática & Enzimas
  { id: "tgo", grupo: "Função Hepática", nome: "TGO (AST)", unidade: "U/L", min: 5, max: 40 },
  { id: "tgp", grupo: "Função Hepática", nome: "TGP (ALT)", unidade: "U/L", min: 7, max: 56 },
  { id: "gama_gt", grupo: "Função Hepática", nome: "Gama-GT (GGT)", unidade: "U/L", min: 8, max: 61 },
  { id: "fosfatase_alcalina", grupo: "Função Hepática", nome: "Fosfatase Alcalina", unidade: "U/L", min: 35, max: 105 },
  { id: "bilirrubina_total", grupo: "Função Hepática", nome: "Bilirrubina Total", unidade: "mg/dL", min: 0.2, max: 1.2 },
  { id: "bilirrubina_direta", grupo: "Função Hepática", nome: "Bilirrubina Direta", unidade: "mg/dL", min: 0.0, max: 0.3 },
  { id: "bilirrubina_indireta", grupo: "Função Hepática", nome: "Bilirrubina Indireta", unidade: "mg/dL", min: 0.2, max: 0.8 },
  { id: "albumina", grupo: "Função Hepática", nome: "Albumina Sérica", unidade: "g/dL", min: 3.5, max: 5.2 },
  { id: "globulinas", grupo: "Função Hepática", nome: "Globulinas", unidade: "g/dL", min: 2.0, max: 3.5 },
  { id: "relacao_ag", grupo: "Função Hepática", nome: "Relação A/G", unidade: "índice", min: 1.2, max: 2.2 },

  // 6. Hormônios, Medicina Esportiva & Eixo Gonadal/Tireoide
  { id: "testosterona_total", grupo: "Hormônios & Esporte", nome: "Testosterona Total", unidade: "ng/dL", min: 300, max: 950 },
  { id: "testosterona_livre", grupo: "Hormônios & Esporte", nome: "Testosterona Livre Calculada", unidade: "ng/dL", min: 5.0, max: 21.0 },
  { id: "shbg", grupo: "Hormônios & Esporte", nome: "SHBG", unidade: "nmol/L", min: 18, max: 54 },
  { id: "estradiol", grupo: "Hormônios & Esporte", nome: "Estradiol (E2)", unidade: "pg/mL", min: 11, max: 43 },
  { id: "estrona", grupo: "Hormônios & Esporte", nome: "Estrona (E1)", unidade: "pg/mL", min: 15, max: 65 },
  { id: "dhea_s", grupo: "Hormônios & Esporte", nome: "DHEA-S", unidade: "µg/dL", min: 120, max: 520 },
  { id: "prolactina", grupo: "Hormônios & Esporte", nome: "Prolactina", unidade: "ng/mL", min: 2.0, max: 18.0 },
  { id: "lh", grupo: "Hormônios & Esporte", nome: "LH (Hormônio Luteinizante)", unidade: "mUI/mL", min: 1.5, max: 9.3 },
  { id: "fsh", grupo: "Hormônios & Esporte", nome: "FSH (Hormônio Folículo-Estimulante)", unidade: "mUI/mL", min: 1.4, max: 12.4 },
  { id: "progesterona", grupo: "Hormônios & Esporte", nome: "Progesterona", unidade: "ng/mL", min: 0.2, max: 1.4 },
  { id: "cortisol_8h", grupo: "Hormônios & Esporte", nome: "Cortisol Basal (8h)", unidade: "µg/dL", min: 6.2, max: 19.4 },
  { id: "acth", grupo: "Hormônios & Esporte", nome: "ACTH", unidade: "pg/mL", min: 7.2, max: 63.3 },
  { id: "igf1", grupo: "Hormônios & Esporte", nome: "IGF-1 (Somatomedina C)", unidade: "ng/mL", min: 115, max: 307 },
  { id: "gh", grupo: "Hormônios & Esporte", nome: "GH (Hormônio do Crescimento)", unidade: "ng/mL", min: 0.05, max: 3.0 },
  { id: "tsh", grupo: "Hormônios & Esporte", nome: "TSH Ultra Sensível", unidade: "µUI/mL", min: 0.4, max: 4.5 },
  { id: "t4_livre", grupo: "Hormônios & Esporte", nome: "T4 Livre", unidade: "ng/dL", min: 0.8, max: 1.8 },
  { id: "t3_livre", grupo: "Hormônios & Esporte", nome: "T3 Livre", unidade: "pg/mL", min: 2.3, max: 4.2 },
  { id: "t3_reverso", grupo: "Hormônios & Esporte", nome: "T3 Reverso", unidade: "ng/dL", min: 0.09, max: 0.35 },
  { id: "anti_tpo", grupo: "Hormônios & Esporte", nome: "Anti-TPO", unidade: "UI/mL", min: 0, max: 34 },
  { id: "anti_tireoglobulina", grupo: "Hormônios & Esporte", nome: "Anti-Tireoglobulina", unidade: "UI/mL", min: 0, max: 115 },

  // 7. Vitaminas, Minerais & Cinética do Ferro
  { id: "vitamina_d", grupo: "Vitaminas & Minerais", nome: "Vitamina D (25-OH)", unidade: "ng/mL", min: 30, max: 100 },
  { id: "vitamina_b12", grupo: "Vitaminas & Minerais", nome: "Vitamina B12", unidade: "pg/mL", min: 200, max: 900 },
  { id: "acido_folico", grupo: "Vitaminas & Minerais", nome: "Ácido Fólico", unidade: "ng/mL", min: 3.8, max: 16.0 },
  { id: "ferro_serico", grupo: "Vitaminas & Minerais", nome: "Ferro Sérico", unidade: "µg/dL", min: 60, max: 170 },
  { id: "ferritina", grupo: "Vitaminas & Minerais", nome: "Ferritina", unidade: "ng/mL", min: 30, max: 300 },
  { id: "transferrina", grupo: "Vitaminas & Minerais", nome: "Transferrina", unidade: "mg/dL", min: 200, max: 360 },
  { id: "ist", grupo: "Vitaminas & Minerais", nome: "Índice de Saturação de Transferrina", unidade: "%", min: 20, max: 50 },
  { id: "zinco", grupo: "Vitaminas & Minerais", nome: "Zinco Sérico", unidade: "µg/dL", min: 70, max: 120 },
  { id: "magnesio", grupo: "Vitaminas & Minerais", nome: "Magnésio Sérico", unidade: "mg/dL", min: 1.6, max: 2.6 },
  { id: "cobre", grupo: "Vitaminas & Minerais", nome: "Cobre Sérico", unidade: "µg/dL", min: 70, max: 140 },

  // 8. Eletrólitos & Gasometria/Acidobásico
  { id: "sodio", grupo: "Eletrólitos", nome: "Sódio (Na+)", unidade: "mEq/L", min: 135, max: 145 },
  { id: "potassio", grupo: "Eletrólitos", nome: "Potássio (K+)", unidade: "mEq/L", min: 3.5, max: 5.1 },
  { id: "cloreto", grupo: "Eletrólitos", nome: "Cloreto (Cl-)", unidade: "mEq/L", min: 98, max: 107 },
  { id: "calcio_total", grupo: "Eletrólitos", nome: "Cálcio Total", unidade: "mg/dL", min: 8.6, max: 10.2 },
  { id: "calcio_ionico", grupo: "Eletrólitos", nome: "Cálcio Iônico", unidade: "mg/dL", min: 4.6, max: 5.3 },
  { id: "fosforo", grupo: "Eletrólitos", nome: "Fósforo Sérico", unidade: "mg/dL", min: 2.5, max: 4.5 },

  // 9. Inflamação, Cardíaco & Lesão Muscular
  { id: "pcr_ultra", grupo: "Inflamação & Lesão", nome: "PCR Ultrassensível", unidade: "mg/L", min: 0.0, max: 3.0 },
  { id: "vhs", grupo: "Inflamação & Lesão", nome: "VHS (1ª hora)", unidade: "mm/h", min: 0, max: 15 },
  { id: "cpk", grupo: "Inflamação & Lesão", nome: "CPK (Creatinofosfoquinase)", unidade: "U/L", min: 30, max: 200 },
  { id: "ck_mb", grupo: "Inflamação & Lesão", nome: "CK-MB", unidade: "U/L", min: 0, max: 25 },
  { id: "desidrogenase_lactica", grupo: "Inflamação & Lesão", nome: "Desidrogenase Láctica (LDH)", unidade: "U/L", min: 120, max: 246 },
  { id: "homocisteina", grupo: "Inflamação & Lesão", nome: "Homocisteína", unidade: "µmol/L", min: 5.0, max: 15.0 },
  { id: "mioglobina", grupo: "Inflamação & Lesão", nome: "Mioglobina", unidade: "ng/mL", min: 25, max: 72 },

  // 10. Coagulação
  { id: "tp_inr", grupo: "Coagulação", nome: "TP (INR)", unidade: "índice", min: 0.8, max: 1.2 },
  { id: "ttpa", grupo: "Coagulação", nome: "TTPa (Relação)", unidade: "segundos", min: 24, max: 36 },
  { id: "fibrinogenio", grupo: "Coagulação", nome: "Fibrinogênio", unidade: "mg/dL", min: 200, max: 400 },
  { id: "d_dimero", grupo: "Coagulação", nome: "D-Dímero", unidade: "ng/mL", min: 0, max: 500 },

  // 11. Urinálise (Urina Tipo 1 / EAS)
  { id: "densidade_urina", grupo: "Urinálise", nome: "Densidade Urinária", unidade: "g/mL", min: 1.005, max: 1.030 },
  { id: "ph_urina", grupo: "Urinálise", nome: "pH Urinário", unidade: "pH", min: 5.0, max: 7.5 }
];

function abrirModalLancamentoExame() {
  if (!pacienteAtivo) return;
  var form = document.getElementById('formLancamentoExames');
  if (form) form.reset();

  document.getElementById('modalExamesSubinfo').innerText = "Paciente: " + pacienteAtivo.nome + " (" + pacienteAtivo.prontuario + ")";
  document.getElementById('exameDataColeta').value = new Date().toISOString().split('T')[0];

  renderizarGridAnalitosModal();
  document.getElementById('modalExamesLab').style.display = 'flex';
}

function renderizarGridAnalitosModal(filtroTexto) {
  var container = document.getElementById('gridAnalitosExames');
  if (!container) return;

  var termo = (filtroTexto || '').toLowerCase().trim();
  var grupos = {};

  CATALOGO_EXAMES_LAB.forEach(function(ex) {
    if (termo && ex.nome.toLowerCase().indexOf(termo) === -1 && ex.grupo.toLowerCase().indexOf(termo) === -1) {
      return;
    }
    if (!grupos[ex.grupo]) grupos[ex.grupo] = [];
    grupos[ex.grupo].push(ex);
  });

  var html = "";
  Object.keys(grupos).forEach(function(grp) {
    html += '<div style="grid-column: 1 / -1; margin-top: 10px; border-bottom: 2px solid var(--primary); padding-bottom: 4px;">' +
      '<strong style="font-size:0.85rem; color:var(--primary); text-transform:uppercase;">' + grp + '</strong>' +
    '</div>';

    grupos[grp].forEach(function(ex) {
      html += '<div style="background:#f9fbf9; border:1px solid var(--border); border-radius:6px; padding:8px 10px;">' +
        '<label style="font-size:0.75rem; font-weight:700; color:var(--text-main); display:block; margin-bottom:2px;">' + ex.nome + '</label>' +
        '<span style="font-size:0.70rem; color:var(--text-muted); display:block; margin-bottom:4px;">Ref: ' + ex.min + ' a ' + ex.max + ' ' + ex.unidade + '</span>' +
        '<input type="number" step="0.01" class="form-control campo-valor-exame" data-id="' + ex.id + '" placeholder="Resultado (' + ex.unidade + ')" style="padding:5px 8px; font-size:0.82rem;">' +
      '</div>';
    });
  });

  if (html === "") {
    html = '<div style="grid-column: 1 / -1; text-align:center; padding:16px; color:var(--text-muted); font-size:0.85rem;">' +
      'Nenhum exame encontrado com o termo "' + filtroTexto + '". Você pode cadastrá-lo clicando no botão "+ Novo Exame".' +
    '</div>';
  }

  container.innerHTML = html;
}

function filtrarAnalitosModalAoDigitar(e) {
  renderizarGridAnalitosModal(e.target.value);
}

function adicionarExamePersonalizadoAoCatalogo() {
  var nome = prompt("Nome do novo exame a cadastrar (Ex: Zinco Eritrocitário, Leptina, etc.):");
  if (!nome || !nome.trim()) return;

  var grupo = prompt("Grupo / Categoria (Ex: Hormônios, Imunologia, Bioquímica):", "Outros Laboratoriais") || "Outros Laboratoriais";
  var unidade = prompt("Unidade de medida (Ex: ng/mL, mg/dL, %):", "mg/dL") || "";
  var min = parseFloat(prompt("Valor Mínimo de Referência:", "0")) || 0;
  var max = parseFloat(prompt("Valor Máximo de Referência:", "100")) || 100;

  var idGerado = "custom_" + Date.now();
  CATALOGO_EXAMES_LAB.push({
    id: idGerado,
    grupo: grupo.trim(),
    nome: nome.trim(),
    unidade: unidade.trim(),
    min: min,
    max: max
  });

  renderizarGridAnalitosModal();
  alert('Exame "' + nome + '" adicionado à base de dados!');
}

function fecharModalLancamentoExame() {
  document.getElementById('modalExamesLab').style.display = 'none';
}

function salvarLoteExames(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  if (!pacienteAtivo) return false;

  var dataColeta = document.getElementById('exameDataColeta').value;
  var lab = document.getElementById('exameLaboratorio').value.trim() || 'Não especificado';
  if (!dataColeta) {
    alert("Informe a data de coleta do exame.");
    return false;
  }

  var resultadosMapeados = {};
  var totalPreenchidos = 0;

  document.querySelectorAll('.campo-valor-exame').forEach(function(input) {
    var valorStr = input.value.trim();
    if (valorStr !== "") {
      var num = parseFloat(valorStr);
      if (!isNaN(num)) {
        var exId = input.getAttribute('data-id');
        resultadosMapeados[exId] = num;
        totalPreenchidos++;
      }
    }
  });

  if (totalPreenchidos === 0) {
    alert("Preencha o resultado de pelo menos um exame para salvar.");
    return false;
  }

  if (!pacienteAtivo.examesLaboratoriais) pacienteAtivo.examesLaboratoriais = [];

  var novoRegistro = {
    id: Date.now(),
    dataColeta: dataColeta,
    laboratorio: lab,
    autor: usuarioLogado.nome,
    valores: resultadosMapeados
  };

  pacienteAtivo.examesLaboratoriais.push(novoRegistro);
  // Ordena cronologicamente para exibição em colunas da mais antiga para a mais recente
  pacienteAtivo.examesLaboratoriais.sort(function(a, b) {
    return new Date(a.dataColeta) - new Date(b.dataColeta);
  });

  fecharModalLancamentoExame();
  renderizarPainelComparativoExames();
  return false;
}

function classificarResultadoExame(valor, min, max) {
  if (typeof valor !== 'number' || isNaN(valor)) {
    return { rotulo: "-", classe: "", badge: '<span style="color:#9ca3af;">-</span>' };
  }
  if (valor < min) {
    return {
      rotulo: "Baixo",
      badge: '<span style="color:#d97706; font-weight:700;">🟡 ⬇ ' + valor + '</span>'
    };
  } else if (valor > max) {
    return {
      rotulo: "Muito Alto",
      badge: '<span style="color:#dc2626; font-weight:700;">🔴 ⬆ ' + valor + '</span>'
    };
  } else {
    return {
      rotulo: "Dentro",
      badge: '<span style="color:#16a34a; font-weight:600;">🟢 ' + valor + '</span>'
    };
  }
}

function renderizarPainelComparativoExames() {
  var container = document.getElementById('containerTabelaComparativaExames');
  if (!container) return;

  if (!pacienteAtivo || !pacienteAtivo.examesLaboratoriais || pacienteAtivo.examesLaboratoriais.length === 0) {
    container.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding:16px; background:#fafcfa; border-radius:8px; border:1px dashed var(--border); text-align:center;">' +
      'Nenhum resultado laboratorial cadastrado para este paciente. Clique em <strong>+ Lançar Novo Exame</strong> para iniciar a tabela comparativa.' +
    '</div>';
    return;
  }

  var coletas = pacienteAtivo.examesLaboratoriais;

  // Monta os cabeçalhos das colunas com as datas
  var colunasTh = coletas.map(function(col, idx) {
    var pData = col.dataColeta.split('-');
    var dataFormatada = (pData.length === 3) ? (pData[2] + "/" + pData[1] + "/" + pData[0]) : col.dataColeta;
    return '<th style="padding:10px 14px; text-align:center; min-width:130px; border-left:1px solid var(--border); background:#f0f5f2;">' +
      '<div><strong>' + dataFormatada + '</strong></div>' +
      '<small style="font-size:0.70rem; color:var(--text-muted); font-weight:normal;">' + col.laboratorio + '</small>' +
    '</th>';
  }).join('');

  // Identifica quais exames do catálogo têm pelo menos um resultado preenchido
  var examesComDados = CATALOGO_EXAMES_LAB.filter(function(cat) {
    return coletas.some(function(c) {
      return typeof c.valores[cat.id] === 'number';
    });
  });

  // Linhas da tabela com cada analito e suas respectivas colunas de datas
  var linhasTr = examesComDados.map(function(cat) {
    var colunasResultados = coletas.map(function(c) {
      var val = c.valores[cat.id];
      var resultado = classificarResultadoExame(val, cat.min, cat.max);
      return '<td style="padding:8px 12px; text-align:center; border-left:1px solid var(--border);">' + resultado.badge + '</td>';
    }).join('');

    return '<tr>' +
      '<td style="padding:8px 12px; font-weight:600; color:var(--text-main);">' + cat.nome + '</td>' +
      '<td style="padding:8px 12px; font-size:0.75rem; color:var(--text-muted);">' + cat.min + ' - ' + cat.max + ' ' + cat.unidade + '</td>' +
      colunasResultados +
    '</tr>';
  }).join('');

  container.innerHTML = '<table style="width:100%; border-collapse:collapse; background:#ffffff;">' +
    '<thead>' +
      '<tr>' +
        '<th style="padding:10px 12px; text-align:left; background:#f9fbf9;">Exame / Parâmetro</th>' +
        '<th style="padding:10px 12px; text-align:left; background:#f9fbf9;">Faixa Normal</th>' +
        colunasTh +
      '</tr>' +
    '</thead>' +
    '<tbody>' +
      linhasTr +
    '</tbody>' +
  '</table>';
}

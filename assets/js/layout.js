// assets/js/layout.js
const PAGINAS_PUBLICAS = ['/pages/login.html', '/pages/cadastro.html'];

function verificarAutenticacao() {
  const caminhoAtual = window.location.pathname;
  const ehPaginaPublica = PAGINAS_PUBLICAS.some(pagina => caminhoAtual.endsWith(pagina));
  const usuarioSalvo = localStorage.getItem('edustream_usuario');

  // Se a página exige login e não há sessão ativa, barra o acesso
  if (!ehPaginaPublica && !usuarioSalvo) {
    window.location.href = '/pages/login.html';
    return null;
  }

  return usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
}

async function carregarLayout() {
  const usuario = verificarAutenticacao();

  // 1. Injeta o Header
  const headerContainer = document.getElementById('app-header');
  if (headerContainer) {
    const respHeader = await fetch('/components/header.html');
    if (respHeader.ok) {
      headerContainer.innerHTML = await respHeader.text();
      marcarMenuAtivo();
      configurarSessaoHeader(usuario);
    }
  }

  // 2. Injeta o Footer
  const footerContainer = document.getElementById('app-footer');
  if (footerContainer) {
    const respFooter = await fetch('/components/footer.html');
    if (respFooter.ok) {
      footerContainer.innerHTML = await respFooter.text();
    }
  }
}

function marcarMenuAtivo() {
  const paginaAtual = window.location.pathname;
  const links = document.querySelectorAll('nav a');
  links.forEach(link => {
    if (paginaAtual.endsWith(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });
}

function configurarSessaoHeader(usuario) {
  if (!usuario) return;

  // Faz o link "Sair" destruir a sessão no localStorage
  const linkSair = document.querySelector('nav a[href*="login.html"]');
  if (linkSair) {
    linkSair.textContent = `Sair (${usuario.nome.split(' ')[0]})`;
    linkSair.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('edustream_usuario');
      window.location.href = '/pages/login.html';
    });
  }
}

// Executa a trava de segurança imediatamente antes mesmo de renderizar
verificarAutenticacao();
document.addEventListener('DOMContentLoaded', carregarLayout);

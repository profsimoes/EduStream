// assets/js/layout.js
async function carregarLayout() {
  // 1. Injeta o Header
  const headerContainer = document.getElementById('app-header');
  if (headerContainer) {
    const respHeader = await fetch('/components/header.html');
    if (respHeader.ok) {
      headerContainer.innerHTML = await respHeader.text();
      marcarMenuAtivo();
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

// Destaca automaticamente o link da página atual no menu
function marcarMenuAtivo() {
  const paginaAtual = window.location.pathname;
  const links = document.querySelectorAll('nav a');
  links.forEach(link => {
    if (paginaAtual.endsWith(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', carregarLayout);

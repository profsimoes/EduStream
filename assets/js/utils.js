// Formata segundos em "12min 30s"
function formatarDuracao(segundos) {
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return seg > 0 ? `${min}min ${seg}s` : `${min}min`;
}

// Formata data ISO em "03/11/2026"
function formatarData(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("pt-BR");
}

// Regra oficial do projeto: concluído quando atinge 90% da duração
function estaConcluido(segundosAssistidos, duracaoSegundos) {
  return segundosAssistidos >= duracaoSegundos * 0.9;
}

// Lê parâmetro da URL, ex: conteudo.html?id=5
function lerParametro(nome) {
  return new URLSearchParams(window.location.search).get(nome);
}

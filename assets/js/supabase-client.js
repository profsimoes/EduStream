// Cria o cliente Supabase usando a biblioteca carregada via CDN no HTML.
// Todas as páginas devem importar este arquivo DEPOIS do CDN do Supabase.
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

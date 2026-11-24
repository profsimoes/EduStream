// assets/js/supabase-client.js
const { createClient } = window.supabase;

// Usa as constantes definidas em supabase-config.js
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Disponibiliza globalmente com os nomes que as equipes e a IA mais usam
window.supabaseClient = _supabase;
window.clienteSupabase = _supabase;
window.db = _supabase;

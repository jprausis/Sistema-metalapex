import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente devem ser configuradas no Easypanel / Vercel / .env local
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://n8n-supabase.mbowiv.easypanel.host/';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
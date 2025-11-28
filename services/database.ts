import { supabase } from '../lib/supabase';
import { Budget, Client, ServiceProduct, User } from '../types';

// Este arquivo servirá de ponte para o banco de dados real.
// Para ativar, você precisará substituir as chamadas do 'storageService' por este 'databaseService'
// nos componentes, e transformar os componentes em assíncronos (async/await).

export const databaseService = {
  // Exemplo de como ficaria a busca de clientes
  getClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
    return data || [];
  },

  saveClient: async (client: Client) => {
    // Remove ID se for novo para o banco gerar, ou update se já existir
    const { data, error } = await supabase.from('clients').upsert(client);
    return { data, error };
  },

  // Busca de Orçamentos
  getBudgets: async (): Promise<Budget[]> => {
    const { data, error } = await supabase.from('budgets').select('*');
    // Precisamos converter os nomes de colunas do banco (snake_case) para o frontend (camelCase)
    // Ou usar um mapper. O Supabase retorna JSON, então se salvamos como JSON, volta ok.
    if (error) return [];
    
    return data.map((b: any) => ({
      ...b,
      createdAt: b.created_at,
      validUntil: b.valid_until,
      clientName: b.client_name,
      paymentConditions: b.payment_conditions,
      executionTerm: b.execution_term,
      // ... mapear outros campos
    })) as Budget[];
  }
};
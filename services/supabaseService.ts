import { supabase } from '../lib/supabase';
import { Budget, Client, ServiceProduct, User, UserRole, BudgetStatus } from '../types';

// Utilitário para converter snake_case (banco) para camelCase (app)
const mapBudgetFromDB = (data: any): Budget => ({
  ...data,
  clientId: data.client_id,
  clientName: data.client_name,
  createdAt: data.created_at,
  validUntil: data.valid_until,
  paymentConditions: data.payment_conditions,
  executionTerm: data.execution_term,
  responsibleId: data.responsible_id,
  responsibleName: data.responsible_name,
  // Items já vem como JSONb, então deve estar ok, caso contrário precisa de parse
  items: typeof data.items === 'string' ? JSON.parse(data.items) : data.items
});

const mapBudgetToDB = (budget: Partial<Budget>) => ({
  id: budget.id,
  number: budget.number,
  client_id: budget.clientId,
  client_name: budget.clientName,
  status: budget.status,
  subtotal: budget.subtotal,
  freight: budget.freight,
  installation: budget.installation,
  discount: budget.discount,
  total: budget.total,
  payment_conditions: budget.paymentConditions,
  execution_term: budget.executionTerm,
  notes: budget.notes,
  responsible_id: budget.responsibleId,
  responsible_name: budget.responsibleName,
  valid_until: budget.validUntil,
  items: budget.items // Supabase converte array/obj para JSONB automaticamente
});

export const supabaseService = {
  // --- CLIENTS ---
  getClients: async (): Promise<Client[]> => {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
    return data || [];
  },

  saveClient: async (client: Partial<Client>) => {
    // Se tiver ID e não for novo, é update. Se o ID for gerado no front, usamos upsert.
    // O ideal é deixar o banco gerar UUID, mas para compatibilidade com o código anterior:
    const { data, error } = await supabase.from('clients').upsert({
      id: client.id,
      name: client.name,
      document: client.document,
      phone: client.phone,
      email: client.email,
      address: client.address,
      notes: client.notes
    }).select().single();
    
    if (error) throw error;
    return data;
  },

  deleteClient: async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  },

  // --- SERVICES ---
  getServices: async (): Promise<ServiceProduct[]> => {
    const { data, error } = await supabase.from('services').select('*').order('name');
    if (error) return [];
    
    return data?.map((s: any) => ({
      ...s,
      basePrice: s.base_price,
      calculationType: s.calculation_type
    })) || [];
  },

  saveService: async (service: Partial<ServiceProduct>) => {
    const payload = {
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      calculation_type: service.calculationType,
      base_price: service.basePrice
    };
    
    const { data, error } = await supabase.from('services').upsert(payload).select().single();
    if (error) throw error;
    return data;
  },

  deleteService: async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
  },

  // --- BUDGETS ---
  getBudgets: async (): Promise<Budget[]> => {
    const { data, error } = await supabase.from('budgets').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      return [];
    }
    return data?.map(mapBudgetFromDB) || [];
  },

  getBudgetById: async (id: string): Promise<Budget | null> => {
    const { data, error } = await supabase.from('budgets').select('*').eq('id', id).single();
    if (error || !data) return null;
    return mapBudgetFromDB(data);
  },

  saveBudget: async (budget: Partial<Budget>) => {
    const payload = mapBudgetToDB(budget);
    
    // Se o ID for numérico (do Date.now() antigo) e estivermos migrando, 
    // o Supabase vai reclamar se a coluna for UUID.
    // Assumindo que o banco está configurado com UUIDs conforme script SQL.
    // Se for criar novo, removemos o ID para o banco gerar (se a coluna for default uuid_generate_v4())
    
    // NOTA: O app atual gera ID com Date.now().toString() que não é UUID válido.
    // Vamos verificar se é um ID novo
    if (payload.id && !payload.id.includes('-')) {
       // É um ID provisório do front, deixe undefined para o banco criar UUID
       delete payload.id; 
    }

    const { data, error } = await supabase.from('budgets').upsert(payload).select().single();
    if (error) throw error;
    return mapBudgetFromDB(data);
  },

  updateBudgetStatus: async (id: string, status: string) => {
    const { error } = await supabase.from('budgets').update({ status }).eq('id', id);
    if (error) throw error;
  },

  generateBudgetNumber: async () => {
    const year = new Date().getFullYear();
    // Count budgets from this year
    const { count, error } = await supabase
      .from('budgets')
      .select('*', { count: 'exact', head: true })
      .ilike('number', `MA-${year}-%`);
    
    if (error) {
        console.error(error);
        return `MA-${year}-ERR`;
    }

    const next = (count || 0) + 1;
    return `MA-${year}-${next.toString().padStart(4, '0')}`;
  },

  // --- USERS / PROFILES ---
  getProfiles: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) return [];
    return data as User[]; // A tabela profiles deve bater com a interface User
  },
  
  updateProfile: async (user: Partial<User>) => {
      const { error } = await supabase.from('profiles').update({
          name: user.name,
          role: user.role,
          active: user.active
      }).eq('id', user.id);
      if (error) throw error;
  }
};
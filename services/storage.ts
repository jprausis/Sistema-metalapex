import { Budget, Client, ServiceProduct, CalculationType, User, UserRole } from '../types';

// Initial Mock Data
const INITIAL_USERS: User[] = [
  { 
    id: '1', 
    name: 'Administrador Metal Apex', 
    email: 'admin@metalapex.com.br', 
    password: '123', // Demo password
    role: UserRole.ADMIN,
    active: true
  },
  { 
    id: '2', 
    name: 'Vendedor Exemplo', 
    email: 'vendedor@metalapex.com.br', 
    password: '123', 
    role: UserRole.SELLER,
    active: true
  }
];

const INITIAL_SERVICES: ServiceProduct[] = [
  { id: '1', name: 'Portão Basculante', description: 'Estrutura em metalon, fechamento em chapa.', calculationType: CalculationType.M2, basePrice: 450, category: 'Portões' },
  { id: '2', name: 'Guarda-corpo Inox', description: 'Tubular redondo com acabamento polido.', calculationType: CalculationType.LINEAR, basePrice: 380, category: 'Serralheria' },
  { id: '3', name: 'Grade de Proteção', description: 'Ferro chato e redondo maciço.', calculationType: CalculationType.M2, basePrice: 280, category: 'Serralheria' },
  { id: '4', name: 'Motor de Portão', description: 'Kit motor deslizante rápido.', calculationType: CalculationType.UNIT, basePrice: 600, category: 'Automação' },
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Construtora Exemplo Ltda',
    document: '12.345.678/0001-90',
    phone: '(11) 99999-8888',
    email: 'contato@construtoraexemplo.com.br',
    address: { street: 'Av. Industrial', number: '1000', district: 'Centro', city: 'São Paulo', state: 'SP', zip: '01000-000' },
    notes: 'Cliente recorrente'
  }
];

// Helper to simulate DB
const get = <T>(key: string, initial: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored);
};

const set = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const storageService = {
  // Users
  getUsers: () => get<User[]>('ma_users', INITIAL_USERS),
  saveUsers: (users: User[]) => set('ma_users', users),
  
  // Clients
  getClients: () => get<Client[]>('ma_clients', INITIAL_CLIENTS),
  saveClients: (clients: Client[]) => set('ma_clients', clients),
  
  // Services
  getServices: () => get<ServiceProduct[]>('ma_services', INITIAL_SERVICES),
  saveServices: (services: ServiceProduct[]) => set('ma_services', services),
  
  // Budgets
  getBudgets: () => get<Budget[]>('ma_budgets', []),
  saveBudgets: (budgets: Budget[]) => set('ma_budgets', budgets),
  
  generateBudgetNumber: (budgets: Budget[]) => {
    const year = new Date().getFullYear();
    const count = budgets.filter(b => b.number.includes(`MA-${year}`)).length + 1;
    return `MA-${year}-${count.toString().padStart(4, '0')}`;
  }
};
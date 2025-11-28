export enum CalculationType {
  M2 = 'M2',
  LINEAR = 'LINEAR',
  UNIT = 'UNIT'
}

export enum BudgetStatus {
  DRAFT = 'Rascunho',
  SENT = 'Enviado',
  FOLLOW_UP = 'Follow-up',
  VISIT = 'Visita Agendada',
  CLOSED = 'Pedido Fechado',
  LOST = 'Pedido Perdido'
}

export enum UserRole {
  ADMIN = 'Administrador',
  SELLER = 'Vendedor'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In real app, this would be hashed. Storing plain for demo.
  role: UserRole;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  document: string; // CPF/CNPJ
  phone: string;
  email: string;
  address: {
    street: string;
    number: string;
    district: string;
    city: string;
    state: string;
    zip: string;
  };
  notes?: string;
}

export interface ServiceProduct {
  id: string;
  name: string;
  description: string;
  calculationType: CalculationType;
  basePrice: number;
  category: string;
}

export interface BudgetItem {
  id: string;
  serviceId: string; // Links to ServiceProduct
  name: string;
  description: string;
  calculationType: CalculationType;
  width: number; // For M2 or Linear
  height: number; // For M2
  depth?: number; // Optional
  quantity: number;
  unitPrice: number;
  difficultyFactor: number; // Default 1.0
  total: number;
  observations?: string;
}

export interface Budget {
  id: string;
  number: string; // Format MA-2025-0001
  clientId: string;
  clientName: string; // Denormalized for display
  createdAt: string;
  validUntil: string;
  status: BudgetStatus;
  items: BudgetItem[];
  subtotal: number;
  freight: number;
  installation: number;
  discount: number;
  total: number;
  paymentConditions: string;
  executionTerm: string; // Days
  notes?: string;
  responsibleId: string; // Link to User ID
  responsibleName: string; // Denormalized name
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
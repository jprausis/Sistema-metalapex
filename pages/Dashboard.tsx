import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storage';
import { Budget, BudgetStatus, formatCurrency } from '../types';
import { DollarSign, FileClock, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    setBudgets(storageService.getBudgets());
  }, []);

  const handleStatusChange = (id: string, newStatus: string) => {
    const updatedBudgets = budgets.map(b => 
      b.id === id ? { ...b, status: newStatus as BudgetStatus } : b
    );
    setBudgets(updatedBudgets);
    storageService.saveBudgets(updatedBudgets);
  };

  // Pending includes Sent, Follow-up, and Visit Scheduled
  const pendingAmount = budgets
    .filter(b => [BudgetStatus.SENT, BudgetStatus.FOLLOW_UP, BudgetStatus.VISIT].includes(b.status))
    .reduce((acc, curr) => acc + curr.total, 0);

  // Approved is now CLOSED
  const approvedAmount = budgets
    .filter(b => b.status === BudgetStatus.CLOSED)
    .reduce((acc, curr) => acc + curr.total, 0);

  const pendingCount = budgets.filter(b => [BudgetStatus.SENT, BudgetStatus.FOLLOW_UP, BudgetStatus.VISIT].includes(b.status)).length;

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-gray-800">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  const getStatusColor = (status: BudgetStatus) => {
    switch (status) {
      case BudgetStatus.CLOSED: return 'bg-green-100 text-green-700 border-green-200';
      case BudgetStatus.LOST: return 'bg-red-100 text-red-700 border-red-200';
      case BudgetStatus.SENT: return 'bg-blue-100 text-blue-700 border-blue-200';
      case BudgetStatus.FOLLOW_UP: return 'bg-orange-100 text-orange-700 border-orange-200';
      case BudgetStatus.VISIT: return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
        <Link 
          to="/budgets/new"
          className="bg-[#F08736] hover:bg-[#d6762f] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Novo Orçamento
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Em Negociação" 
          value={formatCurrency(pendingAmount)} 
          icon={FileClock} 
          color="bg-blue-500" 
          subtext={`${pendingCount} orçamentos ativos`}
        />
        <StatCard 
          title="Faturamento (Fechado)" 
          value={formatCurrency(approvedAmount)} 
          icon={CheckCircle} 
          color="bg-green-500"
          subtext="Pedidos confirmados"
        />
        <StatCard 
          title="Total de Orçamentos" 
          value={budgets.length} 
          icon={DollarSign} 
          color="bg-[#54595F]"
          subtext="Registros no sistema"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Orçamentos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Número</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {budgets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Nenhum orçamento registrado ainda.
                  </td>
                </tr>
              ) : (
                budgets.slice().reverse().slice(0, 5).map((budget) => (
                  <tr key={budget.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{budget.number}</td>
                    <td className="px-6 py-4">{budget.clientName}</td>
                    <td className="px-6 py-4">{new Date(budget.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium">{formatCurrency(budget.total)}</td>
                    <td className="px-6 py-4">
                      <select 
                        value={budget.status}
                        onChange={(e) => handleStatusChange(budget.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#F08736] ${getStatusColor(budget.status)}`}
                      >
                         {Object.values(BudgetStatus).map(status => (
                           <option key={status} value={status} className="bg-white text-gray-800">
                             {status}
                           </option>
                         ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/budgets/${budget.id}`} className="text-[#F08736] hover:text-[#d6762f] font-medium text-xs">
                        Ver Detalhes
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
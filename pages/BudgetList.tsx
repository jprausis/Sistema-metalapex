import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storage';
import { generateBudgetPDF } from '../services/pdfGenerator';
import { Budget, BudgetStatus, formatCurrency } from '../types';
import { Link } from 'react-router-dom';
import { FileText, Plus, Search, Edit3, FileDown, Loader2 } from 'lucide-react';

const BudgetList: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [filter, setFilter] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const filtered = budgets.filter(b => 
    b.clientName.toLowerCase().includes(filter.toLowerCase()) || 
    b.number.toLowerCase().includes(filter.toLowerCase())
  ).reverse();

  const handleDownloadPdf = async (budget: Budget) => {
    setDownloadingId(budget.id);
    try {
      // We need the full client object to generate the PDF
      const clients = storageService.getClients();
      const client = clients.find(c => c.id === budget.clientId);

      if (client) {
        await generateBudgetPDF(budget, client);
      } else {
        alert('Erro: Cliente associado a este orçamento não foi encontrado no banco de dados.');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusColor = (status: BudgetStatus) => {
    switch (status) {
      case BudgetStatus.CLOSED: return 'bg-green-100 text-green-700 border-green-200';
      case BudgetStatus.LOST: return 'bg-red-100 text-red-700 border-red-200';
      case BudgetStatus.SENT: return 'bg-blue-100 text-blue-700 border-blue-200';
      case BudgetStatus.FOLLOW_UP: return 'bg-orange-100 text-orange-700 border-orange-200';
      case BudgetStatus.VISIT: return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Meus Orçamentos</h1>
        <Link 
          to="/budgets/new" 
          className="flex items-center bg-[#F08736] hover:bg-[#d6762f] text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} className="mr-2" /> Criar Novo
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Filtrar por número ou cliente..." 
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F08736] bg-white"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (
           <div className="text-center py-12 text-gray-500">Nenhum orçamento encontrado.</div>
        ) : (
          filtered.map(budget => (
            <div key={budget.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-all">
              <div className="flex items-start space-x-4 mb-4 md:mb-0">
                <div className="p-3 bg-blue-50 text-[#54595F] rounded-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{budget.number}</h3>
                  <p className="text-gray-600 font-medium">{budget.clientName}</p>
                  <p className="text-xs text-gray-400 mt-1">Criado em: {new Date(budget.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between md:space-x-8 w-full md:w-auto">
                 <div className="text-right mr-4 hidden md:block">
                    <p className="text-xs text-gray-400">Valor Total</p>
                    <p className="font-bold text-gray-900 text-lg">{formatCurrency(budget.total)}</p>
                 </div>
                 
                 <div className="mr-4">
                    <select 
                      value={budget.status}
                      onChange={(e) => handleStatusChange(budget.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#F08736] ${getStatusColor(budget.status)}`}
                    >
                      {Object.values(BudgetStatus).map(status => (
                        <option key={status} value={status} className="bg-white text-gray-800">
                          {status}
                        </option>
                      ))}
                    </select>
                 </div>

                 <div className="flex items-center space-x-2">
                   <button 
                      onClick={() => handleDownloadPdf(budget)}
                      disabled={downloadingId === budget.id}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Baixar PDF"
                   >
                      {downloadingId === budget.id ? (
                        <Loader2 size={20} className="animate-spin text-green-600" />
                      ) : (
                        <FileDown size={20} />
                      )}
                   </button>
                   
                   <Link to={`/budgets/${budget.id}`} className="p-2 text-gray-400 hover:text-[#F08736] hover:bg-orange-50 rounded-lg transition-colors" title="Editar">
                      <Edit3 size={20} />
                   </Link>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BudgetList;
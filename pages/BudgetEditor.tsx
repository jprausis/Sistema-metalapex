import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storageService } from '../services/storage';
import { generateBudgetPDF } from '../services/pdfGenerator';
import { Budget, BudgetItem, Client, ServiceProduct, CalculationType, BudgetStatus, formatCurrency } from '../types';
import { ChevronRight, ChevronLeft, Save, FileDown, Plus, Trash2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BudgetEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State lifted from StepClient
  const [clientSearch, setClientSearch] = useState('');

  // Data Sources
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceProduct[]>([]);

  // Form State
  const [budget, setBudget] = useState<Partial<Budget>>({
    status: BudgetStatus.DRAFT,
    items: [],
    subtotal: 0,
    freight: 0,
    installation: 0,
    discount: 0,
    total: 0,
    executionTerm: '15 dias úteis',
    paymentConditions: '50% de entrada + 50% na entrega',
    responsibleName: '',
    responsibleId: ''
  });

  // Load Initial Data
  useEffect(() => {
    setClients(storageService.getClients());
    setServices(storageService.getServices());

    if (id) {
      const allBudgets = storageService.getBudgets();
      const existing = allBudgets.find(b => b.id === id);
      if (existing) {
        setBudget(existing);
        if (existing.clientName) setClientSearch(existing.clientName);
      }
    } else {
      // New Budget
      const allBudgets = storageService.getBudgets();
      setBudget(prev => ({
        ...prev,
        number: storageService.generateBudgetNumber(allBudgets),
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // +20 days
        responsibleName: user?.name || '',
        responsibleId: user?.id || ''
      }));
    }
  }, [id, user]);

  // Calculations
  useEffect(() => {
    const subtotal = (budget.items || []).reduce((acc, item) => acc + item.total, 0);
    const total = subtotal + (budget.freight || 0) + (budget.installation || 0) - (budget.discount || 0);
    setBudget(prev => ({ ...prev, subtotal, total }));
  }, [budget.items, budget.freight, budget.installation, budget.discount]);

  const handleAddItem = () => {
    const newItem: BudgetItem = {
      id: Date.now().toString(),
      serviceId: '',
      name: '',
      description: '',
      calculationType: CalculationType.M2,
      width: 0,
      height: 0,
      quantity: 1,
      unitPrice: 0,
      difficultyFactor: 1,
      total: 0
    };
    setBudget(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const updateItem = (index: number, field: keyof BudgetItem, value: any) => {
    const newItems = [...(budget.items || [])];
    const item = { ...newItems[index], [field]: value };

    // Auto-calculate logic
    if (field === 'serviceId') {
      const s = services.find(srv => srv.id === value);
      if (s) {
        item.name = s.name;
        item.description = s.description;
        item.calculationType = s.calculationType;
        item.unitPrice = s.basePrice;
      }
    }

    // Calc Total
    let measure = 1;
    if (item.calculationType === CalculationType.M2) measure = item.width * item.height;
    else if (item.calculationType === CalculationType.LINEAR) measure = item.width;
    
    // Ensure numbers are treated correctly
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const diff = Number(item.difficultyFactor) || 1;
    
    item.total = measure * qty * price * diff;

    newItems[index] = item;
    setBudget(prev => ({ ...prev, items: newItems }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...(budget.items || [])];
    newItems.splice(index, 1);
    setBudget(prev => ({ ...prev, items: newItems }));
  };

  const handleSave = () => {
    if (!budget.clientId) return alert('Selecione um cliente');
    if (!budget.items?.length) return alert('Adicione pelo menos um item');

    const allBudgets = storageService.getBudgets();
    let updatedBudgets = [...allBudgets];

    if (id) {
      const idx = updatedBudgets.findIndex(b => b.id === id);
      updatedBudgets[idx] = budget as Budget;
    } else {
      updatedBudgets.push({ ...budget, id: Date.now().toString() } as Budget);
    }

    storageService.saveBudgets(updatedBudgets);
    alert('Orçamento salvo com sucesso!');
    navigate('/budgets');
  };

  const handlePrint = async () => {
    if (!budget.clientId) return;
    const client = clients.find(c => c.id === budget.clientId);
    if (client && budget.items) {
      setLoading(true);
      await generateBudgetPDF(budget as Budget, client);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">
             {id ? `Editar Orçamento ${budget.number}` : 'Novo Orçamento'}
           </h1>
           <p className="text-sm text-gray-500">Preencha as etapas abaixo para gerar o documento.</p>
        </div>
        <div className="flex items-center space-x-2">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <ChevronLeft />
            </button>
          )}
          <div className="px-4 py-1 bg-gray-200 rounded-full text-sm font-semibold text-gray-700">
            Etapa {step} de 3
          </div>
          {step < 3 && (
            <button 
              onClick={() => {
                if(step === 1 && !budget.clientId) return alert('Selecione um cliente');
                setStep(step + 1)
              }} 
              className="p-2 bg-[#F08736] text-white rounded-lg hover:bg-[#d6762f] shadow-sm"
            >
              <ChevronRight />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
        {/* STEP 1: CLIENT SELECTION */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">1. Selecione o Cliente</h2>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input 
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white transition-colors"
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(client => (
                <div 
                  key={client.id}
                  onClick={() => {
                    setBudget(prev => ({ ...prev, clientId: client.id, clientName: client.name }));
                    setClientSearch(client.name);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    budget.clientId === client.id 
                      ? 'border-[#F08736] bg-orange-50 shadow-sm ring-1 ring-[#F08736]' 
                      : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
                  }`}
                >
                  <h3 className="font-bold text-gray-800">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.document}</p>
                  <p className="text-sm text-gray-600 mt-1">{client.address.city} - {client.address.state}</p>
                </div>
              ))}
            </div>
            {budget.clientId && (
               <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm border border-green-200">
                 Cliente selecionado: <strong>{budget.clientName}</strong>
               </div>
            )}
          </div>
        )}

        {/* STEP 2: ITEMS */}
        {step === 2 && (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
               <h2 className="text-xl font-semibold text-gray-800">2. Itens do Orçamento</h2>
               <button onClick={handleAddItem} className="flex items-center text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors">
                 <Plus size={16} className="mr-1" /> Adicionar Item
               </button>
             </div>

             {budget.items?.length === 0 && (
               <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                 Nenhum item adicionado.
               </div>
             )}

             <div className="space-y-6">
               {budget.items?.map((item, idx) => (
                 <div key={item.id} className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm relative">
                    <button 
                      onClick={() => handleRemoveItem(idx)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                       {/* Product Selection */}
                       <div className="md:col-span-4">
                         <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Serviço</label>
                         <select 
                           className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-[#F08736]"
                           value={item.serviceId}
                           onChange={(e) => updateItem(idx, 'serviceId', e.target.value)}
                         >
                           <option value="">Selecione...</option>
                           {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                       </div>
                       
                       <div className="md:col-span-8">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-[#F08736]" 
                            value={item.name} 
                            onChange={e => updateItem(idx, 'name', e.target.value)}
                          />
                       </div>

                       {/* Dimensions */}
                       <div className="md:col-span-2">
                         <label className="block text-xs font-medium text-gray-600 mb-1">Largura (m)</label>
                         <input 
                            type="number" 
                            step="0.01" 
                            className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-[#F08736]" 
                            value={item.width || ''} 
                            onChange={e => updateItem(idx, 'width', parseFloat(e.target.value))} 
                         />
                       </div>
                       
                       {item.calculationType === CalculationType.M2 && (
                         <div className="md:col-span-2">
                           <label className="block text-xs font-medium text-gray-600 mb-1">Altura (m)</label>
                           <input 
                              type="number" 
                              step="0.01" 
                              className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-[#F08736]" 
                              value={item.height || ''} 
                              onChange={e => updateItem(idx, 'height', parseFloat(e.target.value))} 
                            />
                         </div>
                       )}

                       <div className="md:col-span-2">
                         <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                         <input 
                            type="number" 
                            className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-[#F08736]" 
                            value={item.quantity || ''} 
                            onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value))} 
                         />
                       </div>

                       {/* Price Factors */}
                       <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Preço Unit/m²</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-[#F08736]" 
                            value={item.unitPrice || ''} 
                            onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value))} 
                          />
                       </div>

                       <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">Dificuldade</label>
                          <select className="w-full p-2 border border-gray-300 rounded bg-white focus:ring-2 focus:ring-[#F08736]" value={item.difficultyFactor} onChange={e => updateItem(idx, 'difficultyFactor', parseFloat(e.target.value))}>
                             <option value={1}>1.0 (Normal)</option>
                             <option value={1.2}>1.2 (Difícil)</option>
                             <option value={1.5}>1.5 (Complexo)</option>
                          </select>
                       </div>

                       {/* Total Display */}
                       <div className="md:col-span-2 flex items-end justify-end">
                          <div className="text-right">
                             <span className="block text-xs text-gray-500">Total Item</span>
                             <span className="font-bold text-lg text-[#F08736]">{formatCurrency(item.total)}</span>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* STEP 3: TOTALS */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">3. Fechamento e Condições</h2>
              
              {/* Status Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-600">Status:</label>
                <select 
                  className="p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]"
                  value={budget.status}
                  onChange={(e) => setBudget({...budget, status: e.target.value as BudgetStatus})}
                >
                  {Object.values(BudgetStatus).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condições de Pagamento</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F08736] transition-colors" 
                      value={budget.paymentConditions}
                      onChange={e => setBudget({...budget, paymentConditions: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Execução</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F08736] transition-colors" 
                      value={budget.executionTerm}
                      onChange={e => setBudget({...budget, executionTerm: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações Gerais</label>
                    <textarea 
                      className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#F08736] transition-colors" 
                      rows={4}
                      value={budget.notes}
                      onChange={e => setBudget({...budget, notes: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                    <input 
                      type="text" 
                      disabled
                      className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500" 
                      value={budget.responsibleName}
                    />
                  </div>
               </div>

               <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 h-fit">
                  <h3 className="font-semibold text-gray-900 mb-4 border-b border-blue-200 pb-2">Resumo Financeiro</h3>
                  
                  <div className="space-y-3 mb-6">
                     <div className="flex justify-between text-gray-600">
                        <span>Subtotal Itens</span>
                        <span>{formatCurrency(budget.subtotal || 0)}</span>
                     </div>
                     
                     <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">Frete (R$)</span>
                        <input 
                          type="number" 
                          className="w-24 p-1 text-right text-sm border border-blue-200 rounded bg-white focus:ring-2 focus:ring-[#F08736]" 
                          value={budget.freight || ''}
                          onChange={e => setBudget({...budget, freight: parseFloat(e.target.value) || 0})}
                        />
                     </div>

                     <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">Instalação (R$)</span>
                        <input 
                          type="number" 
                          className="w-24 p-1 text-right text-sm border border-blue-200 rounded bg-white focus:ring-2 focus:ring-[#F08736]" 
                          value={budget.installation || ''}
                          onChange={e => setBudget({...budget, installation: parseFloat(e.target.value) || 0})}
                        />
                     </div>

                     <div className="flex justify-between items-center text-red-600">
                        <span className="text-sm">Desconto (R$)</span>
                        <input 
                          type="number" 
                          className="w-24 p-1 text-right text-sm border border-red-200 rounded bg-white text-red-600 focus:ring-2 focus:ring-red-500" 
                          value={budget.discount || ''}
                          onChange={e => setBudget({...budget, discount: parseFloat(e.target.value) || 0})}
                        />
                     </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-blue-200">
                     <span className="text-lg font-bold text-gray-900">Total Geral</span>
                     <span className="text-2xl font-bold text-[#F08736]">{formatCurrency(budget.total || 0)}</span>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-10 lg:pl-64">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-500">
             Total: <span className="font-bold text-gray-900">{formatCurrency(budget.total || 0)}</span>
          </div>
          <div className="flex space-x-4">
             {id && (
               <button 
                 onClick={handlePrint} 
                 disabled={loading}
                 className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
               >
                 <FileDown size={18} className="mr-2" /> {loading ? 'Gerando...' : 'PDF'}
               </button>
             )}
             <button 
               onClick={handleSave} 
               className="flex items-center px-6 py-2 bg-[#F08736] text-white rounded-lg hover:bg-[#d6762f] shadow-md font-medium"
             >
               <Save size={18} className="mr-2" /> Salvar Orçamento
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetEditor;
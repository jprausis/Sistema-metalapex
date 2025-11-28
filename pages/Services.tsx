import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storage';
import { ServiceProduct, CalculationType, formatCurrency } from '../types';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceProduct[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceProduct | null>(null);

  const [formData, setFormData] = useState<Partial<ServiceProduct>>({});

  useEffect(() => {
    setServices(storageService.getServices());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newServices = [...services];
    
    if (editingService) {
      const index = newServices.findIndex(s => s.id === editingService.id);
      newServices[index] = { ...editingService, ...formData as ServiceProduct };
    } else {
      newServices.push({
        ...formData as ServiceProduct,
        id: Date.now().toString(),
      });
    }

    storageService.saveServices(newServices);
    setServices(newServices);
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Remover este serviço?')) {
      const newServices = services.filter(s => s.id !== id);
      storageService.saveServices(newServices);
      setServices(newServices);
    }
  };

  const openModal = (service?: ServiceProduct) => {
    if (service) {
      setEditingService(service);
      setFormData(service);
    } else {
      setEditingService(null);
      setFormData({
        name: '', description: '', calculationType: CalculationType.M2, basePrice: 0, category: 'Geral'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Serviços e Preços</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center bg-[#F08736] hover:bg-[#d6762f] text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" /> Novo Serviço
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium text-sm">
            <tr>
              <th className="px-6 py-3">Serviço</th>
              <th className="px-6 py-3">Categoria</th>
              <th className="px-6 py-3">Cálculo</th>
              <th className="px-6 py-3">Preço Base</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="text-xs text-gray-500">{service.description}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700">
                    <Tag size={12} className="mr-1" /> {service.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {service.calculationType === 'M2' ? 'Por m²' : service.calculationType === 'LINEAR' ? 'Metro Linear' : 'Unidade'}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(service.basePrice)}</td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => openModal(service)} className="text-gray-400 hover:text-[#F08736] transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(service.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-gray-50 rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-800">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800"><Plus size={24} className="transform rotate-45" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
                <input required type="text" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input type="text" list="categories" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                <datalist id="categories">
                  <option value="Portões" />
                  <option value="Serralheria" />
                  <option value="Automação" />
                  <option value="Estruturas" />
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Padrão</label>
                <textarea className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cálculo</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.calculationType} onChange={e => setFormData({...formData, calculationType: e.target.value as CalculationType})}>
                    <option value={CalculationType.M2}>Metro Quadrado (m²)</option>
                    <option value={CalculationType.LINEAR}>Metro Linear</option>
                    <option value={CalculationType.UNIT}>Unidade (Peça)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base (R$)</label>
                  <input required type="number" step="0.01" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-white bg-[#F08736] rounded-lg hover:bg-[#d6762f] shadow-sm transition-colors">Salvar Serviço</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
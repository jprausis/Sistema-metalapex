import React, { useEffect, useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { Client } from '../types';
import { Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Client>>({
    address: { street: '', number: '', district: '', city: '', state: '', zip: '' }
  });

  const loadClients = async () => {
    try {
      const data = await supabaseService.getClients();
      setClients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        id: editingClient ? editingClient.id : undefined // Undefined pra criar novo (DB gera UUID)
      };

      await supabaseService.saveClient(payload as Client);
      await loadClients();
      closeModal();
    } catch (error) {
      alert('Erro ao salvar cliente');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este cliente?')) {
      try {
        await supabaseService.deleteClient(id);
        setClients(clients.filter(c => c.id !== id));
      } catch (error) {
        alert('Erro ao deletar. Verifique se o cliente possui orçamentos.');
      }
    }
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({
        name: '', document: '', phone: '', email: '',
        address: { street: '', number: '', district: '', city: '', state: '', zip: '' },
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) ||
    (c.document && c.document.includes(searchTerm))
  );

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#F08736]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center bg-[#F08736] hover:bg-[#d6762f] text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" /> Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar por nome, telefone ou CPF/CNPJ..." 
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F08736] focus:border-[#F08736] bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">{client.name}</h3>
                <p className="text-xs text-gray-500">{client.document || 'Documento não informado'}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openModal(client)} className="text-gray-400 hover:text-[#F08736] transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(client.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium text-gray-800">Tel:</span> {client.phone}</p>
              <p><span className="font-medium text-gray-800">Email:</span> {client.email}</p>
              <p className="text-xs text-gray-400 truncate mt-2">
                {client.address?.street}, {client.address?.number} - {client.address?.city}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-gray-50 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-800">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800"><Plus size={24} className="transform rotate-45" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Razão Social</label>
                  <input required type="text" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ <span className="text-xs text-gray-400 font-normal">(Opcional)</span></label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input required type="text" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input type="email" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                
                <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Endereço</p>
                </div>
                
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rua</label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.address?.street} onChange={e => setFormData({...formData, address: {...formData.address!, street: e.target.value}})} />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Número</label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.address?.number} onChange={e => setFormData({...formData, address: {...formData.address!, number: e.target.value}})} />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Bairro</label>
                   <input type="text" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.address?.district} onChange={e => setFormData({...formData, address: {...formData.address!, district: e.target.value}})} />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Cidade</label>
                   <input type="text" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.address?.city} onChange={e => setFormData({...formData, address: {...formData.address!, city: e.target.value}})} />
                </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                   <input type="text" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.address?.state} onChange={e => setFormData({...formData, address: {...formData.address!, state: e.target.value}})} />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-white bg-[#F08736] rounded-lg hover:bg-[#d6762f] shadow-sm transition-colors flex items-center">
                  {saving && <Loader2 className="animate-spin mr-2" size={16} />}
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
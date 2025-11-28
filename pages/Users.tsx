import React, { useEffect, useState } from 'react';
import { supabaseService } from '../services/supabaseService';
import { User, UserRole } from '../types';
import { Plus, Edit2, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({
    active: true,
    role: UserRole.SELLER
  });

  const loadUsers = async () => {
      try {
          const data = await supabaseService.getProfiles();
          setUsers(data);
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    // Auth Guard for Admin
    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      navigate('/');
      return;
    }
    loadUsers();
  }, [currentUser, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
        if (editingUser) {
             // Atualizar perfil existente
             await supabaseService.updateProfile({ ...editingUser, ...formData } as User);
        } else {
             // Criar usuário novo via Supabase é complexo via Client-side sem "Service Role".
             // Vamos apenas exibir um alerta informativo, pois a criação real deve ser feita
             // via convite do Supabase ou criando uma Edge Function.
             alert('Para criar novos usuários, use o painel do Supabase > Authentication > Add User. O perfil será criado automaticamente no primeiro login.');
        }
        await loadUsers();
        closeModal();
    } catch (error) {
        alert('Erro ao salvar usuário');
    } finally {
        setSaving(false);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ ...user }); 
      setIsModalOpen(true);
    } else {
        // Modo criação desabilitado por enquanto no front
        alert('Por favor, crie o usuário no painel do Supabase.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#F08736]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Usuários</h1>
        <div className="text-sm text-gray-500">
            Nota: A criação de contas deve ser feita no painel administrativo do banco.
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium text-sm">
            <tr>
              <th className="px-6 py-3">Nome</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Permissão</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 flex items-center">
                  <div className="bg-gray-200 p-2 rounded-full mr-3 text-gray-600">
                    <UserIcon size={16} />
                  </div>
                  <span className="font-medium text-gray-900">{u.name}</span>
                </td>
                <td className="px-6 py-4 text-gray-600">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                    {u.role === UserRole.ADMIN && <Shield size={12} className="mr-1" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {u.active ? (
                    <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">Ativo</span>
                  ) : (
                    <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded">Inativo</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => openModal(u)} className="text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
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
              <h2 className="text-xl font-bold text-gray-800">Editar Permissões</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800"><Plus size={24} className="transform rotate-45" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input required type="text" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login)</label>
                <input disabled type="email" className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500" value={formData.email} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    <option value={UserRole.SELLER}>Vendedor</option>
                    <option value={UserRole.ADMIN}>Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#F08736]" value={formData.active ? 'true' : 'false'} onChange={e => setFormData({...formData, active: e.target.value === 'true'})}>
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-white bg-[#F08736] rounded-lg hover:bg-[#d6762f] shadow-sm flex items-center">
                    {saving && <Loader2 className="animate-spin mr-2" size={16} />}
                    Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
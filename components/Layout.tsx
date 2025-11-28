import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText, LogOut, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/budgets', icon: FileText, label: 'Orçamentos' },
    { path: '/clients', icon: Users, label: 'Clientes' },
    { path: '/services', icon: Package, label: 'Serviços & Preços' },
  ];

  // Only Admin can see Users menu
  if (user?.role === UserRole.ADMIN) {
    menuItems.push({ path: '/users', icon: Shield, label: 'Usuários' });
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar - Using #54595F (approx slate-600/700 but custom) */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#54595F] text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-center h-24 px-6 bg-[#45494e]">
          <img 
            src="https://metalapex.com.br/wp-content/uploads/2025/07/Logo-metal-apex-branca-h-1.png" 
            alt="Metal Apex" 
            className="h-12 w-auto object-contain"
          />
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute right-4 text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-[#F08736] text-white shadow-md' // Orange active state
                    : 'text-gray-300 hover:bg-[#6c7178] hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#6c7178]">
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold text-white">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-[#6c7178] hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b shadow-sm lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 focus:outline-none">
            <Menu size={24} />
          </button>
          <span className="font-semibold text-gray-700">Metal Apex</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
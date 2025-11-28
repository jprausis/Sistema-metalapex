import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Services from './pages/Services';
import BudgetList from './pages/BudgetList';
import BudgetEditor from './pages/BudgetEditor';
import Login from './pages/Login';
import Users from './pages/Users';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
      <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
      <Route path="/budgets" element={<ProtectedRoute><BudgetList /></ProtectedRoute>} />
      <Route path="/budgets/new" element={<ProtectedRoute><BudgetEditor /></ProtectedRoute>} />
      <Route path="/budgets/:id" element={<ProtectedRoute><BudgetEditor /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      {/* O basename diz ao React Router que todas as rotas começam após /sistema */}
      <Router basename="/sistema">
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
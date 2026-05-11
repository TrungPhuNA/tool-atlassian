import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Server, LogOut, BarChart3, User as UserIcon, RefreshCw } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import TaskListView from './pages/tasks/TaskListView';
import AdminJiraConfig from './pages/admin/AdminJiraConfig';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminSyncManagement from './pages/admin/AdminSyncManagement';
import Toast from './components/Toast';
import { AnimatePresence } from 'framer-motion';

// Thành phần bảo vệ Route
const ProtectedRoute = ({ children, user, requireAdmin = false }) => {
  if (!user || !user.id) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/tasks" replace />;

  return children;
};

// Layout chính cho ứng dụng sau khi đăng nhập
const MainLayout = ({ children, user, onLogout }) => {
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    onLogout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-100">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">Jira Insight</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <Link 
                to="/tasks"
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${location.pathname === '/tasks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LayoutGrid className="w-4 h-4" /> Công việc
              </Link>
              {isAdmin && (
                <>
                  <Link 
                    to="/admin/sync"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${location.pathname === '/admin/sync' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <RefreshCw className="w-4 h-4" /> Đồng bộ
                  </Link>
                  <Link 
                    to="/admin/config"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${location.pathname === '/admin/config' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Server className="w-4 h-4" /> Cấu hình
                  </Link>
                  <Link 
                    to="/admin/users"
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${location.pathname === '/admin/users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <UserIcon className="w-4 h-4" /> Thành viên
                  </Link>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-slate-800">{user.full_name || user.username}</span>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{user.role}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 py-10">
        {children}
      </main>

      <footer className="py-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] border-t border-slate-100">
        Jira Reporting Tool • Optimized for Interspace VN
      </footer>
    </div>
  );
};

function App() {
  const [user, setUser] = React.useState(JSON.parse(localStorage.getItem('user')));
  const [toast, setToast] = React.useState(null);

  const showToast = (type, message) => setToast({ type, message });

  const loginSuccess = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    showToast('success', `Chào mừng ${userData.full_name || userData.username} quay trở lại!`);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    showToast('info', 'Bạn đã đăng xuất khỏi hệ thống');
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage user={user} />} />
        <Route path="/login" element={<LoginPage onLoginSuccess={loginSuccess} showToast={showToast} />} />

        {/* User Routes */}
        <Route path="/tasks" element={
          <ProtectedRoute user={user}>
            <MainLayout user={user} onLogout={logout}><TaskListView showToast={showToast} /></MainLayout>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin/config" element={
          <ProtectedRoute user={user} requireAdmin={true}>
            <MainLayout user={user} onLogout={logout}><AdminJiraConfig showToast={showToast} /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/sync" element={
          <ProtectedRoute user={user} requireAdmin={true}>
            <MainLayout user={user} onLogout={logout}><AdminSyncManagement showToast={showToast} /></MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/users" element={
          <ProtectedRoute user={user} requireAdmin={true}>
            <MainLayout user={user} onLogout={logout}><AdminUserManagement showToast={showToast} /></MainLayout>
          </ProtectedRoute>
        } />

        {/* Redirect if not found */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AnimatePresence>
        {toast && (
          <Toast 
            type={toast.type} 
            message={toast.message} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </Router>
  );
}

export default App;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, Loader2, BarChart3, ArrowRight } from 'lucide-react';
import client from '../api/client';
import { motion } from 'framer-motion';

const LoginPage = ({ onLoginSuccess, showToast }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', formData);
      onLoginSuccess(data.data.user, data.data.token);
      navigate('/tasks');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100"
      >
        <div className="p-8 lg:p-10 space-y-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-100">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chào mừng trở lại!</h1>
              <p className="text-slate-400 text-sm mt-1 font-medium italic">Đăng nhập để quản lý công việc Jira của bạn</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 italic">Tên đăng nhập</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    required type="text" placeholder="Nhập username..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 italic">Mật khẩu</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    required type="password" placeholder="••••••••" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={loading} type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Đăng nhập ngay <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-blue-600 font-bold hover:underline transition-all">Đăng ký thành viên</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Lock, Loader2, BarChart3, ArrowRight, UserCircle } from 'lucide-react';
import client from '../api/client';
import { motion } from 'framer-motion';

const RegisterPage = ({ showToast }) => {
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    full_name: '',
    role: 'user' // Mặc định là user
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post('/auth/register', formData);
      showToast('success', 'Đăng ký tài khoản thành công! Hãy đăng nhập ngay.');
      navigate('/login');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Đăng ký thất bại');
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
            <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-100">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tạo tài khoản mới</h1>
              <p className="text-slate-400 text-sm mt-1 font-medium italic">Gia nhập cộng đồng Jira Insight</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 italic">Họ và tên</label>
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    required type="text" placeholder="Nhập tên của bạn..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                    value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 italic">Tên đăng nhập</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    required type="text" placeholder="Nhập username..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                    value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 italic">Mật khẩu</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    required type="password" placeholder="••••••••" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                    value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <button 
              disabled={loading} type="submit"
              className="w-full py-4 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Đăng ký tài khoản <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-emerald-600 font-bold hover:underline transition-all">Quay về Đăng nhập</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;

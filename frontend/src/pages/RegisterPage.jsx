import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Lock, Loader2, ArrowRight, UserCircle } from 'lucide-react';
import client from '../api/client';
import { motion } from 'framer-motion';

const RegisterPage = ({ showToast }) => {
  const [formData, setFormData] = useState({ username: '', password: '', full_name: '', role: 'user' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const fullNameRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Vui lòng nhập họ và tên';
    if (!formData.username.trim()) newErrors.username = 'Vui lòng nhập tên đăng nhập';
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải từ 6 ký tự';
    }

    setErrors(newErrors);
    if (newErrors.full_name) fullNameRef.current?.focus();
    else if (newErrors.username) usernameRef.current?.focus();
    else if (newErrors.password) passwordRef.current?.focus();

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await client.post('/auth/register', formData);
      showToast('success', 'Đăng ký thành công! Hãy đăng nhập ngay.');
      navigate('/login');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100">
        <div className="p-8 lg:p-10 space-y-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-100"><UserPlus className="w-8 h-8 text-white" /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tạo tài khoản mới</h1>
              <p className="text-slate-400 text-sm mt-1 font-medium italic">Gia nhập cộng đồng Jira Insight</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Họ và tên <span className="text-rose-500">(*)</span></label>
                <div className="relative">
                  <UserCircle className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.full_name ? 'text-rose-500' : 'text-slate-400'}`} />
                  <input ref={fullNameRef} type="text" placeholder="Họ và tên..." className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${errors.full_name ? 'border-rose-500' : 'border-slate-100 focus:border-emerald-500'}`} value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} />
                </div>
                {errors.full_name && <p className="text-[11px] text-rose-500 font-bold px-1 mt-1">{errors.full_name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Tên đăng nhập <span className="text-rose-500">(*)</span></label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.username ? 'text-rose-500' : 'text-slate-400'}`} />
                  <input ref={usernameRef} type="text" placeholder="Username..." className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${errors.username ? 'border-rose-500' : 'border-slate-100 focus:border-emerald-500'}`} value={formData.username} onChange={(e) => handleInputChange('username', e.target.value)} />
                </div>
                {errors.username && <p className="text-[11px] text-rose-500 font-bold px-1 mt-1">{errors.username}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Mật khẩu <span className="text-rose-500">(*)</span></label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.password ? 'text-rose-500' : 'text-slate-400'}`} />
                  <input ref={passwordRef} type="password" placeholder="••••••••" className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${errors.password ? 'border-rose-500' : 'border-slate-100 focus:border-emerald-500'}`} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} />
                </div>
                {errors.password && <p className="text-[11px] text-rose-500 font-bold px-1 mt-1">{errors.password}</p>}
              </div>
            </div>
            <button disabled={loading} type="submit" className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Đăng ký tài khoản <ArrowRight className="w-4 h-4" /></>}</button>
          </form>
          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm font-medium">Đã có tài khoản? <Link to="/login" className="text-emerald-600 font-bold hover:underline">Quay về Đăng nhập</Link></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default RegisterPage;

import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Lock, Loader2, ArrowRight, UserCircle } from 'lucide-react';
import client from '../api/client';
import { motion } from 'framer-motion';

const RegisterPage = ({ showToast }) => {
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    full_name: '',
    role: 'user'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const fullNameRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const navigate = useNavigate();

  // Validate theo rule dự án mục 7.416
  const validate = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Vui lòng nhập họ và tên';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (formData.username.length < 4) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 4 ký tự';
    }
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải từ 6 ký tự trở lên';
    }

    setErrors(newErrors);

    // Auto-focus trường lỗi đầu tiên theo rule 7.428
    if (newErrors.full_name) {
      fullNameRef.current?.focus();
    } else if (newErrors.username) {
      usernameRef.current?.focus();
    } else if (newErrors.password) {
      passwordRef.current?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Rule 7.430: Xóa thông báo lỗi ngay khi người dùng bắt đầu sửa
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await client.post('/auth/register', formData);
      showToast('success', 'Đăng ký thành công! Chào mừng bạn gia nhập hệ thống.');
      navigate('/login');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.';
      showToast('error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100"
      >
        <div className="p-8 lg:p-10 space-y-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-100">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Đăng ký thành viên</h1>
              <p className="text-slate-400 text-sm mt-1 font-medium italic">Bắt đầu quản lý công việc Jira của bạn</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  Họ và tên <span className="text-rose-500">(*)</span>
                </label>
                <div className="relative">
                  <UserCircle className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.full_name ? 'text-rose-500' : 'text-slate-400'}`} />
                  <input 
                    ref={fullNameRef}
                    type="text" placeholder="Nhập tên đầy đủ của bạn..." 
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all outline-none ${errors.full_name ? 'border-rose-500 focus:ring-rose-100' : 'border-slate-100 focus:ring-emerald-100 focus:border-emerald-500'}`}
                    value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)}
                  />
                </div>
                {errors.full_name && <p className="text-[11px] text-rose-500 font-bold px-1 mt-1">{errors.full_name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  Tên đăng nhập <span className="text-rose-500">(*)</span>
                </label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.username ? 'text-rose-500' : 'text-slate-400'}`} />
                  <input 
                    ref={usernameRef}
                    type="text" placeholder="Tên đăng nhập (ít nhất 4 ký tự)..." 
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all outline-none ${errors.username ? 'border-rose-500 focus:ring-rose-100' : 'border-slate-100 focus:ring-emerald-100 focus:border-emerald-500'}`}
                    value={formData.username} onChange={(e) => handleInputChange('username', e.target.value)}
                  />
                </div>
                {errors.username && <p className="text-[11px] text-rose-500 font-bold px-1 mt-1">{errors.username}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  Mật khẩu <span className="text-rose-500">(*)</span>
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.password ? 'text-rose-500' : 'text-slate-400'}`} />
                  <input 
                    ref={passwordRef}
                    type="password" placeholder="Mật khẩu (ít nhất 6 ký tự)..." 
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl text-sm transition-all outline-none ${errors.password ? 'border-rose-500 focus:ring-rose-100' : 'border-slate-100 focus:ring-emerald-100 focus:border-emerald-500'}`}
                    value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>
                {errors.password && <p className="text-[11px] text-rose-500 font-bold px-1 mt-1">{errors.password}</p>}
              </div>
            </div>

            <button 
              disabled={loading} type="submit"
              className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Tạo tài khoản <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-emerald-600 font-bold hover:underline">Quay về Đăng nhập</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;

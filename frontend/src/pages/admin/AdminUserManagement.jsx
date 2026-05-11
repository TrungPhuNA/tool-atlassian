import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, User, Loader2, Mail, Lock, X, Check } from 'lucide-react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUserManagement = ({ showToast }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', full_name: '', role: 'user' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await client.get('/admin/users');
      setUsers(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await client.post('/admin/users', newUser);
      showToast('success', 'Đã thêm thành viên mới thành công!');
      setShowAddModal(false);
      setNewUser({ username: '', password: '', full_name: '', role: 'user' });
      fetchUsers();
    } catch (err) { showToast('error', 'Lỗi khi thêm thành viên.'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return;
    try {
      await client.delete(`/admin/users/${id}`);
      showToast('success', 'Đã xóa thành viên!');
      fetchUsers();
    } catch (err) { showToast('error', 'Không thể xóa thành viên.'); }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý thành viên</h2>
          <p className="text-slate-500 text-xs">Danh sách và phân quyền người dùng hệ thống</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <UserPlus className="w-4 h-4" /> Thêm thành viên
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500">Tài khoản</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500">Họ tên</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-center">Vai trò</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-center">Ngày tạo</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="5" className="px-6 py-6"><div className="h-4 bg-slate-50 rounded w-full"></div></td>
                </tr>
              ))
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">{u.username[0].toUpperCase()}</div>
                    <span className="text-sm font-semibold text-slate-700">{u.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{u.full_name}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                    {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]" onClick={() => setShowFilterModal(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl space-y-6" onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Thêm thành viên mới</h3>
                <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Tên tài khoản</label>
                  <div className="relative">
                    <input type="text" required className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Mật khẩu</label>
                  <div className="relative">
                    <input type="password" required className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Họ và tên</label>
                  <div className="relative">
                    <input type="text" required className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Vai trò</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                    <option value="user">Người dùng (User)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
                <button type="submit" disabled={submitting} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Xác nhận thêm
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUserManagement;

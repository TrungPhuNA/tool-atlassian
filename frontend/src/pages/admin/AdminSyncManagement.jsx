import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, History, CheckCircle2, XCircle, AlertCircle, Play, StopCircle, Trash2, Loader2, Calendar, X } from 'lucide-react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '../../components/Toast';

const AdminSyncManagement = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmData, setConfirmData] = useState(null); // { title, message, onConfirm }

  const showToast = (type, message) => setToast({ type, message });

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await client.get('/admin/jira/sync/history');
      if (data.status === 'success') {
        setHistory(data.data);
      }
    } catch (err) {
      console.error('Lỗi lấy lịch sử:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const handleStartSync = async () => {
    setTriggering(true);
    try {
      await client.post('/admin/jira/sync');
      showToast('info', 'Đã bắt đầu tiến trình đồng bộ ngầm');
      fetchHistory();
    } catch (err) {
      showToast('error', 'Không thể bắt đầu: ' + (err.response?.data?.message || err.message));
    } finally {
      setTriggering(false);
    }
  };

  const handleStopSync = async (id) => {
    setConfirmData({
      title: 'Dừng đồng bộ',
      message: 'Bạn có chắc chắn muốn dừng tiến trình đồng bộ đang chạy này không?',
      onConfirm: async () => {
        setActionLoading(id);
        try {
          await client.post(`/admin/jira/sync/${id}/stop`);
          showToast('success', 'Đã yêu cầu dừng tiến trình');
          fetchHistory();
        } catch (err) {
          showToast('error', 'Lỗi khi dừng: ' + err.message);
        } finally {
          setActionLoading(null);
          setConfirmData(null);
        }
      }
    });
  };

  const handleDeleteSync = async (id) => {
    setConfirmData({
      title: 'Xóa lịch sử',
      message: 'Hành động này sẽ xóa bản ghi lịch sử này. Bạn có chắc chắn không?',
      onConfirm: async () => {
        setActionLoading(id);
        try {
          await client.delete(`/admin/jira/sync/${id}`);
          showToast('success', 'Đã xóa bản ghi thành công');
          fetchHistory();
        } catch (err) {
          showToast('error', 'Lỗi khi xóa: ' + err.message);
        } finally {
          setActionLoading(null);
          setConfirmData(null);
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold border border-emerald-100"><CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành</span>;
      case 'running': return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold border border-blue-100 animate-pulse"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang chạy</span>;
      case 'failed': return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold border border-red-100"><XCircle className="w-3.5 h-3.5" /> Thất bại</span>;
      case 'stopped': return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-semibold border border-slate-200"><StopCircle className="w-3.5 h-3.5" /> Đã dừng</span>;
      default: return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-semibold border border-slate-200"><AlertCircle className="w-3.5 h-3.5" /> Chờ xử lý</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <AnimatePresence>{toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmData && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmData(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-6" onClick={e => e.stopPropagation()}
            >
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">{confirmData.title}</h3>
                <p className="text-sm text-slate-500">{confirmData.message}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmData(null)} className="flex-1 py-2.5 bg-slate-50 text-slate-500 rounded-xl font-bold text-sm border border-slate-200">Hủy</button>
                <button onClick={confirmData.onConfirm} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100">Xác nhận</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="flex items-center justify-between bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform"><RefreshCw className="w-32 h-32 text-blue-600" /></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><RefreshCw className="w-7 h-7 text-blue-600" /> Quản lý Đồng bộ</h2>
          <p className="text-slate-500 mt-1 max-w-md">Kích hoạt và theo dõi lịch sử đồng bộ dữ liệu. Dữ liệu giới hạn từ năm 2026.</p>
        </div>
        <button 
          onClick={handleStartSync}
          disabled={triggering || history.some(h => h.status === 'running')}
          className="relative z-10 flex items-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          {triggering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />} Bắt đầu đồng bộ
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-700 flex items-center gap-2"><History className="w-5 h-5 text-slate-400" /> Lịch sử đồng bộ</h3>
          <span className="text-xs text-slate-400 font-medium italic">Tự động cập nhật mỗi 10 giây</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời gian</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Tiến độ Board</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Kết quả</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Trạng thái</th>
                <th className="px-8 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-8 py-12 text-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" /> Đang tải...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="5" className="px-8 py-12 text-center text-slate-400 italic">Chưa có lịch sử đồng bộ</td></tr>
              ) : (
                history.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{new Date(job.created_at).toLocaleString('vi-VN')}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><Calendar className="w-3 h-3" /> Job ID: #{job.id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-600">{job.synced_boards || 0}/{job.total_boards || 0}</span>
                        <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${(job.synced_boards / job.total_boards * 100) || 0}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-3 text-[11px] font-bold">
                        <div className="flex flex-col"><span className="text-emerald-500">+{job.new_issues_count || 0}</span><span className="text-[9px] text-slate-300 uppercase">Mới</span></div>
                        <div className="w-px h-5 bg-slate-100" />
                        <div className="flex flex-col"><span className="text-blue-500">~{job.updated_issues_count || 0}</span><span className="text-[9px] text-slate-300 uppercase">Sửa</span></div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center flex justify-center">{getStatusBadge(job.status)}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {job.status === 'running' && (
                          <button onClick={() => handleStopSync(job.id)} disabled={actionLoading === job.id} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">{actionLoading === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4" />}</button>
                        )}
                        {job.status !== 'running' && (
                          <button onClick={() => handleDeleteSync(job.id)} disabled={actionLoading === job.id} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">{actionLoading === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSyncManagement;

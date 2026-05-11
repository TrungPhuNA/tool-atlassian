import React, { useState, useEffect } from 'react';
import { RefreshCw, History, Check, AlertTriangle, Loader2, Play } from 'lucide-react';
import client from '../../api/client';

const AdminSyncManagement = ({ showToast }) => {
  const [currentJob, setCurrentJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchHistory();
    const timer = setInterval(checkSyncStatus, 3000);
    return () => clearInterval(timer);
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await client.get('/admin/sync-history');
      setHistory(data.data);
    } catch (err) { console.error(err); }
    finally { setLoadingHistory(false); }
  };

  const checkSyncStatus = async () => {
    try {
      const { data } = await client.get('/admin/jira/sync-status');
      if (data.data) {
        if (currentJob?.status === 'running' && data.data.status === 'completed') fetchHistory();
        setCurrentJob(data.data);
      }
    } catch (err) { console.error(err); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await client.post('/admin/jira/sync');
      setCurrentJob(data.data);
      showToast('info', 'Đã kích hoạt đồng bộ...');
      fetchHistory();
    } catch (err) { showToast('error', 'Lỗi khi kích hoạt đồng bộ.'); }
    finally { setSyncing(false); }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý đồng bộ</h2>
          <p className="text-slate-500 text-xs">Theo dõi lịch sử cập nhật dữ liệu từ Jira</p>
        </div>
        <button 
          onClick={handleSync} disabled={syncing || currentJob?.status === 'running'}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} 
          Chạy đồng bộ mới
        </button>
      </div>

      {currentJob && (
        <div className={`p-6 rounded-xl border ${currentJob.status === 'running' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentJob.status === 'running' ? 'bg-white/20' : 'bg-blue-50'}`}>
                <RefreshCw className={`w-6 h-6 ${currentJob.status === 'running' ? 'text-white animate-spin' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${currentJob.status === 'running' ? 'text-blue-100' : 'text-slate-400'}`}>Tiến trình hiện tại</p>
                <h3 className="text-lg font-bold">{currentJob.status === 'running' ? 'Đang đồng bộ...' : 'Hoàn thành'}</h3>
              </div>
            </div>
            <div className="flex-1 max-w-xs space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>{Math.round((currentJob.synced_boards / currentJob.total_boards) * 100) || 0}%</span>
                <span>{currentJob.synced_boards}/{currentJob.total_boards} Boards</span>
              </div>
              <div className={`w-full h-1.5 rounded-full overflow-hidden ${currentJob.status === 'running' ? 'bg-white/20' : 'bg-slate-100'}`}>
                <div className={`h-full transition-all duration-500 ${currentJob.status === 'running' ? 'bg-white' : 'bg-blue-600'}`} style={{ width: `${(currentJob.synced_boards / currentJob.total_boards) * 100}%` }} />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-[10px] font-bold opacity-60">Mới</p>
                <p className="text-xl font-bold">{currentJob.new_issues_count}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold opacity-60">Cập nhật</p>
                <p className="text-xl font-bold">{currentJob.updated_issues_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">Lịch sử đồng bộ</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500">Thời gian</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 text-center">Trạng thái</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 text-center">Tiến độ</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 text-center">Kết quả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map(job => (
              <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{new Date(job.created_at).toLocaleString('vi-VN')}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${job.status === 'completed' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                    {job.status === 'completed' ? <Check className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />} {job.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm font-semibold text-slate-500">{job.synced_boards}/{job.total_boards}</td>
                <td className="px-6 py-4 text-center text-xs font-medium text-slate-400">+{job.new_issues_count} Mới, +{job.updated_issues_count} Update</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSyncManagement;

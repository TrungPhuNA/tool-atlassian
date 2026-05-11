import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Target, Hash, Calendar, User, Loader2, AlertCircle } from 'lucide-react';
import client from '../api/client';
import { motion } from 'framer-motion';

const TaskDetailModal = ({ taskId, onClose }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (taskId) fetchTaskDetail();
  }, [taskId]);

  const fetchTaskDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await client.get(`/tasks/${taskId}`);
      if (data.status === 'success') {
        setTask(data.data);
      } else {
        setError('Không thể tải thông tin công việc.');
      }
    } catch (err) { 
      console.error(err);
      setError('Lỗi kết nối server hoặc Task không tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  const renderDescription = () => {
    let desc = task?.jira_data?.fields?.description;
    if (!desc) return <span className="italic text-slate-300 font-semibold text-xs">Nội dung mô tả hiện đang trống.</span>;
    
    if (typeof desc !== 'string') {
      return <div className="text-slate-500 italic text-xs">Dữ liệu mô tả không phải dạng văn bản.</div>;
    }

    const formattedDesc = desc
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    return (
      <div 
        className="prose prose-blue prose-sm max-w-none whitespace-pre-wrap text-slate-700 font-medium leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formattedDesc }}
      />
    );
  };

  if (!taskId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 5 }}
        className="bg-white w-full max-w-5xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100" onClick={e => e.stopPropagation()}
      >
        {/* Header - Nhỏ gọn hơn */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-blue-600 text-[11px] font-bold tracking-tight">{task?.issue_key || taskId}</span>
              <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
              <span className="text-slate-500 text-[10px] font-semibold">{task?.issue_type}</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${task?.status === 'Done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
              {task?.status}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-all cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin opacity-20" />
              <p className="text-slate-400 text-xs font-semibold italic">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center p-6">
              <AlertCircle className="w-8 h-8 text-rose-500 opacity-50" />
              <p className="text-slate-500 text-sm font-semibold">{error}</p>
              <button onClick={fetchTaskDetail} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs">Thử lại</button>
            </div>
          ) : task ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-snug">{task.summary}</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Mô tả công việc</h3>
                  </div>
                  <div className="text-slate-700 text-sm leading-relaxed bg-slate-50/50 p-6 rounded-xl border border-slate-100 min-h-[120px]">
                    {renderDescription()}
                  </div>
                </div>

                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-1 bg-emerald-500 rounded-full"></div>
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Công việc con ({task.subtasks.length})</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {task.subtasks.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl hover:border-blue-300 transition-all group cursor-pointer shadow-sm">
                          <div className="flex items-center gap-4">
                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{sub.issue_key}</span>
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 truncate max-w-sm">{sub.summary}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${sub.status === 'Done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{sub.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 space-y-6 sticky top-0">
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                      {task.assignee_avatar ? <img src={task.assignee_avatar} className="w-10 h-10 rounded-full border border-white" alt="" /> : <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300"><User className="w-5 h-5" /></div>}
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Người làm</p>
                        <p className="text-sm font-bold text-slate-800 truncate" title={task.assignee_name}>{task.assignee_name || 'Chưa giao'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 px-1">
                      {[
                        { icon: <Target className="w-3.5 h-3.5" />, label: 'Sprint', value: task.sprint_name || '—' },
                        { icon: <Hash className="w-3.5 h-3.5" />, label: 'Story Points', value: task.story_points || '0', color: 'text-blue-600' },
                        { icon: <Calendar className="w-3.5 h-3.5" />, label: 'Hạn cuối', value: task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '—', alert: task.due_date && new Date(task.due_date) < new Date() }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-8 h-8 shrink-0 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">{item.icon}</div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                            <p className={`text-xs font-bold ${item.color || (item.alert ? 'text-rose-500' : 'text-slate-800')} truncate`}>{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <a 
                      href={`https://${task.jira_domain}/browse/${task.issue_key}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold hover:bg-blue-700 transition-all shadow-md cursor-pointer"
                    >
                      Mở trên Jira <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};

export default TaskDetailModal;

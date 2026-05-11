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

  if (!taskId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-black rounded-xl border border-blue-100">{task?.issue_key || taskId}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-400 text-sm font-bold uppercase">{task?.issue_type || 'Task'}</span>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-full text-slate-400 transition-all border border-slate-50 shadow-sm cursor-pointer"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin opacity-20" />
              <p className="text-slate-400 text-sm font-bold italic">Đang lấy dữ liệu từ Jira...</p>
            </div>
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <p className="text-slate-600 font-bold">{error}</p>
              <button onClick={fetchTaskDetail} className="text-blue-600 text-sm font-black hover:underline cursor-pointer">Thử lại</button>
            </div>
          ) : task ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 leading-tight tracking-tight">{task.summary}</h2>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">Mô tả chi tiết</h3>
                  <div className="text-slate-600 text-sm leading-relaxed bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 min-h-[150px] shadow-inner font-medium">
                    {task.jira_data?.fields?.description ? (
                      <div className="prose prose-slate max-w-none prose-sm" dangerouslySetInnerHTML={{ __html: task.jira_data.fields.description }} />
                    ) : (
                      <span className="italic text-slate-300 font-bold">Nội dung mô tả hiện đang trống.</span>
                    )}
                  </div>
                </div>

                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">Các công việc con ({task.subtasks.length})</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {task.subtasks.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all group cursor-pointer">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">{sub.issue_key}</span>
                            <span className="text-sm font-bold text-slate-700 truncate max-w-md group-hover:text-blue-600">{sub.summary}</span>
                          </div>
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${sub.status === 'Done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{sub.status.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="bg-slate-50/80 p-8 rounded-[2.5rem] border border-slate-100 space-y-8 shadow-sm">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      {task.assignee_avatar ? <img src={task.assignee_avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-md" alt="" /> : <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 shadow-inner"><User className="w-5 h-5" /></div>}
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Người thực hiện</p>
                        <p className="text-sm font-black text-slate-800">{task.assignee_name || 'CHƯA PHÂN CÔNG'}</p>
                      </div>
                    </div>
                    
                    {[
                      { icon: <Target className="w-4 h-4" />, label: 'Sprint hiện tại', value: task.sprint_name || 'N/A' },
                      { icon: <Hash className="w-4 h-4" />, label: 'Story Points', value: task.story_points || '0', highlight: true },
                      { icon: <Calendar className="w-4 h-4" />, label: 'Hạn hoàn thành', value: task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : 'CHƯA CÓ', alert: task.due_date && new Date(task.due_date) < new Date() }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">{item.icon}</div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</p>
                          <p className={`text-sm font-black ${item.highlight ? 'text-blue-600' : item.alert ? 'text-rose-500' : 'text-slate-800'}`}>{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-slate-200">
                    <a 
                      href={`https://${task.jira_domain}/browse/${task.issue_key}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-3 w-full py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-md cursor-pointer"
                    >
                      XEM TRÊN JIRA <ExternalLink className="w-4 h-4" />
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

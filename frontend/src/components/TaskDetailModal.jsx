import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Target, Hash, Calendar, User, Layers, Loader2 } from 'lucide-react';
import client from '../api/client';
import { motion } from 'framer-motion';

const TaskDetailModal = ({ taskId, onClose }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (taskId) fetchTaskDetail();
  }, [taskId]);

  const fetchTaskDetail = async () => {
    setLoading(true);
    try {
      const { data } = await client.get(`/tasks/${taskId}`);
      setTask(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (!taskId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}
      >
        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100">{task?.issue_key || '...'}</span>
            <span className="text-slate-400 text-sm">/</span>
            <span className="text-slate-400 text-sm font-medium">{task?.issue_type}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-all"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-tight">{task.summary}</h2>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">Mô tả công việc</h3>
                  <div className="text-slate-600 text-sm leading-relaxed bg-slate-50/50 p-6 rounded-xl border border-slate-100 min-h-[100px]">
                    {task.jira_data?.fields?.description || <span className="italic text-slate-400 font-medium">Không có mô tả chi tiết.</span>}
                  </div>
                </div>

                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">Các công việc con ({task.subtasks.length})</h3>
                    <div className="space-y-2">
                      {task.subtasks.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-all group">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">{sub.issue_key}</span>
                            <span className="text-sm font-medium text-slate-700 truncate max-w-md">{sub.summary}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sub.status === 'Done' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'}`}>{sub.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {task.assignee_avatar ? <img src={task.assignee_avatar} className="w-8 h-8 rounded-full border border-white shadow-sm" alt="" /> : <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-300"><User className="w-4 h-4" /></div>}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Người thực hiện</p>
                        <p className="text-sm font-semibold text-slate-800">{task.assignee_name || 'Chưa phân công'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Sprint hiện tại</p>
                        <p className="text-sm font-semibold text-slate-800">{task.sprint_name || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Hash className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Story Points</p>
                        <p className="text-sm font-semibold text-slate-800">{task.story_points || '0'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Hạn hoàn thành</p>
                        <p className={`text-sm font-semibold ${task.due_date && new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-slate-800'}`}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200">
                    <a 
                      href={`https://${task.jira_domain}/browse/${task.issue_key}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                    >
                      Mở trong Jira <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TaskDetailModal;

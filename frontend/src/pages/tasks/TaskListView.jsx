import React, { useState, useEffect, useCallback, memo } from 'react';
import { Search, Filter, Calendar, User, RefreshCw, X, AlertCircle, Copy, Check, Info, LayoutList, CheckCircle2 } from 'lucide-react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import TaskDetailModal from '../../components/TaskDetailModal';

const TYPE_COLORS = {
  'Story': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Bug': 'bg-rose-50 text-rose-700 border-rose-100',
  'Task': 'bg-blue-50 text-blue-700 border-blue-100',
  'Epic': 'bg-violet-50 text-violet-700 border-violet-100',
  'Sub-task': 'bg-slate-50 text-slate-600 border-slate-100',
};

const TaskRow = memo(({ task, onSelect }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasDesc = !!task.has_description;
  const hasSP = !!(task.story_points && parseFloat(task.story_points) > 0);
  const hasDue = !!task.due_date;

  return (
    <tr 
      onClick={() => onSelect(task)}
      className="group hover:bg-slate-50 transition-all cursor-pointer border-b border-slate-50"
    >
      <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${TYPE_COLORS[task.issue_type] || 'bg-slate-50'}`}>
            {task.issue_type}
          </span>
          <div 
            onClick={(e) => handleCopy(e, task.issue_key)}
            className="flex items-center gap-1 text-xs font-mono font-semibold text-slate-400 hover:text-blue-600 transition-colors cursor-copy"
          >
            {task.issue_key}
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 cursor-pointer">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!hasDesc && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-bold rounded border border-amber-100 leading-none">Thiếu mô tả</span>}
            {!hasSP && <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-bold rounded border border-orange-100 leading-none">Chưa chấm SP</span>}
            {!hasDue && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold rounded border border-rose-100 leading-none">Thiếu hạn</span>}
            <span className="text-sm font-semibold text-slate-700 line-clamp-1 group-hover:text-blue-600 transition-colors">{task.summary}</span>
          </div>
          {task.sprint_name && (
            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> {task.sprint_name}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-slate-500 cursor-pointer">
        {task.status}
      </td>
      <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
        <div className="flex items-center gap-2">
          {task.assignee_avatar ? (
            <img src={task.assignee_avatar} alt="" className="w-6 h-6 rounded-full border border-slate-200 shadow-sm" title={task.assignee_name} />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"><User className="w-3 h-3 text-slate-400" /></div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center cursor-pointer">
        <span className={`text-xs font-bold ${hasSP ? 'text-blue-600' : 'text-slate-300'}`}>{task.story_points || '0'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-medium text-slate-500 cursor-pointer">
        {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-medium text-slate-400 cursor-pointer">
        {task.start_date ? new Date(task.start_date).toLocaleDateString('vi-VN') : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right cursor-pointer">
        {(!hasDesc || !hasSP || !hasDue) ? <AlertCircle className="w-4 h-4 text-orange-400 opacity-60" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-40" />}
      </td>
    </tr>
  );
});

const TaskListView = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, standard: 0, missingDescription: 0, missingStoryPoints: 0, missingDueDate: 0 });
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({ statuses: [], users: [], sprints: [] });
  const [filters, setFilters] = useState({
    search: '',
    statuses: [],
    assigneeIds: [],
    sprints: [],
    missing_description: false,
    missing_story_points: false,
    missing_due_date: false
  });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const { data } = await client.get('/admin/jira/filters/options');
      setFilterOptions({
        statuses: data.data.statuses.map(s => ({ value: s, label: s })),
        users: data.data.users.map(u => ({ value: u.id, label: u.name, avatar: u.avatar })),
        sprints: data.data.sprints.map(s => ({ value: s, label: s }))
      });
    } catch (err) { console.error('Lỗi lấy options:', err); }
  }, []);

  const fetchTasks = useCallback(async (isReset = false) => {
    if (isReset) setLoading(true);
    try {
      const params = {
        page: 1, limit: 100,
        search: filters.search?.trim() || undefined,
        status: filters.statuses.length > 0 ? filters.statuses.map(s => s.value).join(',') : undefined,
        assignee_id: filters.assigneeIds.length > 0 ? filters.assigneeIds.map(u => u.value).join(',') : undefined,
        sprint: filters.sprints.length > 0 ? filters.sprints.map(s => s.value).join(',') : undefined,
        missing_description: filters.missing_description || undefined,
        missing_story_points: filters.missing_story_points || undefined,
        missing_due_date: filters.missing_due_date || undefined
      };
      const { data } = await client.get('/tasks', { params });
      setTasks(data.data);
      if (data.stats) setStats(data.stats);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    const timer = setTimeout(() => fetchTasks(true), 400);
    return () => clearTimeout(timer);
  }, [fetchTasks]);

  const customSelectStyles = {
    control: (base) => ({ ...base, borderRadius: '12px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', padding: '2px', boxShadow: 'none', cursor: 'pointer' }),
    option: (base, state) => ({ ...base, cursor: 'pointer', backgroundColor: state.isFocused ? '#eff6ff' : 'white', color: state.isFocused ? '#2563eb' : '#475569' }),
    multiValue: (base) => ({ ...base, backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '8px' }),
    multiValueLabel: (base) => ({ ...base, color: '#475569', fontWeight: 'bold', fontSize: '11px' }),
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <LayoutList className="w-8 h-8 text-blue-600" /> Danh sách công việc
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium italic">Theo dõi hiệu suất và kiểm soát chất lượng dữ liệu Jira</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex-1 max-w-2xl justify-end">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" placeholder="Tìm theo mã, tiêu đề, người làm..." 
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
              value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <button 
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
          >
            <Filter className="w-4 h-4" /> Bộ lọc
            {(filters.statuses.length + filters.assigneeIds.length + filters.sprints.length + (filters.missing_description ? 1 : 0) + (filters.missing_story_points ? 1 : 0) + (filters.missing_due_date ? 1 : 0)) > 0 && (
              <span className="px-1.5 py-0.5 bg-white text-blue-600 text-[10px] rounded-full font-bold">
                {filters.statuses.length + filters.assigneeIds.length + filters.sprints.length + (filters.missing_description ? 1 : 0) + (filters.missing_story_points ? 1 : 0) + (filters.missing_due_date ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Statistics Block */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Tổng số Task', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: LayoutList },
          { 
            label: 'Đạt tiêu chuẩn', 
            value: stats.standard, 
            color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2 
          },
          { 
            label: 'Thiếu mô tả', 
            value: stats.missingDescription, 
            color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Info 
          },
          { 
            label: 'Chưa chấm SP', 
            value: stats.missingStoryPoints, 
            color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: AlertCircle 
          },
          { 
            label: 'Thiếu hạn', 
            value: stats.missingDueDate, 
            color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: Calendar 
          },
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-2xl border ${stat.bg} ${stat.border} shadow-sm flex flex-col gap-1`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${stat.color} opacity-80`}>{stat.label}</span>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-2xl font-black text-slate-800">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 whitespace-nowrap tracking-wider">Mã Task</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 whitespace-nowrap tracking-wider">Tiêu đề công việc</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 whitespace-nowrap tracking-wider text-center">Trạng thái</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 whitespace-nowrap tracking-wider">Người đảm nhận</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 whitespace-nowrap tracking-wider text-center">SP</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 whitespace-nowrap tracking-wider text-center">Deadline</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 whitespace-nowrap tracking-wider text-center">Ngày tạo</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 whitespace-nowrap tracking-wider text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} onSelect={(t) => setSelectedTaskId(t.issue_key)} />
              ))}
              {loading && (
                <tr><td colSpan="8" className="px-6 py-20 text-center"><RefreshCw className="w-10 h-10 animate-spin mx-auto text-blue-100" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowFilterModal(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-800">Bộ lọc thông minh</h3>
                <button onClick={() => setShowFilterModal(false)} className="p-2 hover:bg-white rounded-full border border-slate-100 cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Trạng thái</label>
                    <Select isMulti options={filterOptions.statuses} styles={customSelectStyles} placeholder="Chọn..." value={filters.statuses} onChange={v => setFilters({...filters, statuses: v})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Sprint</label>
                    <Select isMulti options={filterOptions.sprints} styles={customSelectStyles} placeholder="Chọn..." value={filters.sprints} onChange={v => setFilters({...filters, sprints: v})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Người làm</label>
                  <Select isMulti options={filterOptions.users} styles={customSelectStyles} placeholder="Chọn..." value={filters.assigneeIds} onChange={v => setFilters({...filters, assigneeIds: v})} 
                    formatOptionLabel={opt => (
                      <div className="flex items-center gap-2">
                        {opt.avatar ? <img src={opt.avatar} className="w-5 h-5 rounded-full" /> : <div className="w-5 h-5 rounded-full bg-slate-100" />}
                        <span className="text-xs font-semibold">{opt.label}</span>
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Chất lượng dữ liệu</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { key: 'missing_description', label: 'Thiếu mô tả', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                      { key: 'missing_story_points', label: 'Thiếu SP', color: 'bg-orange-50 text-orange-600 border-orange-100' },
                      { key: 'missing_due_date', label: 'Thiếu hạn', color: 'bg-rose-50 text-rose-600 border-rose-100' }
                    ].map(opt => (
                      <label key={opt.key} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer ${filters[opt.key] ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${opt.color}`}>{opt.label}</span>
                        <input type="checkbox" className="hidden" checked={filters[opt.key]} onChange={e => setFilters({...filters, [opt.key]: e.target.checked})} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setFilters({ search: '', statuses: [], assigneeIds: [], sprints: [], missing_description: false, missing_story_points: false, missing_due_date: false })} className="px-6 py-2 text-sm font-semibold text-slate-400 hover:text-slate-800 cursor-pointer">Làm mới</button>
                <button onClick={() => setShowFilterModal(false)} className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 cursor-pointer">Áp dụng</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTaskId && <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default TaskListView;

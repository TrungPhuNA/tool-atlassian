import React, { useState, useEffect, useCallback, memo } from 'react';
import { Search, Filter, Calendar, User, RefreshCw, X, AlertCircle, Copy, Check, Info, LayoutList, CheckCircle2 } from 'lucide-react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import TaskDetailModal from '../../components/TaskDetailModal';

const TYPE_COLORS = {
  'Story': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Bug': 'bg-rose-100 text-rose-700 border-rose-200',
  'Task': 'bg-blue-100 text-blue-700 border-blue-200',
  'Epic': 'bg-violet-100 text-violet-700 border-violet-200',
  'Sub-task': 'bg-slate-100 text-slate-600 border-slate-200',
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
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${TYPE_COLORS[task.issue_type] || 'bg-slate-100'}`}>
            {task.issue_type}
          </span>
          <div 
            onClick={(e) => handleCopy(e, task.issue_key)}
            className="flex items-center gap-1 text-xs font-mono font-bold text-slate-400 hover:text-blue-600 transition-colors cursor-copy"
          >
            {task.issue_key}
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 cursor-pointer">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!hasDesc && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded border border-amber-200 leading-none">THIẾU MÔ TẢ</span>}
            {!hasSP && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-black rounded border border-orange-200 leading-none">CHƯA CHẤM SP</span>}
            {!hasDue && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black rounded border border-rose-200 leading-none">THIẾU HẠN</span>}
            <span className="text-sm font-bold text-slate-700 line-clamp-1 group-hover:text-blue-600 transition-colors">{task.summary}</span>
          </div>
          {task.sprint_name && (
            <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> {task.sprint_name}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-slate-500 uppercase cursor-pointer">
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
        {(!hasDesc || !hasSP || !hasDue) ? <AlertCircle className="w-4 h-4 text-orange-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-40" />}
      </td>
    </tr>
  );
});

const TaskListView = () => {
  const [tasks, setTasks] = useState([]);
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
      const { data } = await client.get('/tasks/filters/options');
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
    control: (base) => ({ ...base, borderRadius: '14px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', padding: '4px', boxShadow: 'none', cursor: 'pointer' }),
    option: (base, state) => ({ ...base, cursor: 'pointer', backgroundColor: state.isFocused ? '#eff6ff' : 'white', color: state.isFocused ? '#2563eb' : '#475569' }),
    multiValue: (base) => ({ ...base, backgroundColor: '#e2e8f0', color: '#475569', borderRadius: '10px' }),
    multiValueLabel: (base) => ({ ...base, color: '#475569', fontWeight: 'bold', fontSize: '11px' }),
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
            <LayoutList className="w-10 h-10 text-blue-600" /> Danh sách công việc
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-bold">Theo dõi hiệu suất và kiểm soát chất lượng dữ liệu Jira</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-3 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 flex-1 max-w-2xl justify-end">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" placeholder="Tìm theo mã, tiêu đề, người làm..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
              value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <button 
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
          >
            <Filter className="w-4 h-4" /> Bộ lọc
            {(filters.statuses.length + filters.assigneeIds.length + filters.sprints.length + (filters.missing_description ? 1 : 0) + (filters.missing_story_points ? 1 : 0) + (filters.missing_due_date ? 1 : 0)) > 0 && (
              <span className="px-2 py-0.5 bg-white text-blue-600 text-[10px] rounded-full font-black">
                {filters.statuses.length + filters.assigneeIds.length + filters.sprints.length + (filters.missing_description ? 1 : 0) + (filters.missing_story_points ? 1 : 0) + (filters.missing_due_date ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã Task</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiêu đề công việc</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SP</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Deadline</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ngày tạo</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} onSelect={(t) => setSelectedTaskId(t.issue_key)} />
              ))}
              {loading && (
                <tr><td colSpan="8" className="px-6 py-24 text-center"><RefreshCw className="w-12 h-12 animate-spin mx-auto text-blue-100" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowFilterModal(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Bộ lọc thông minh</h3>
                <button onClick={() => setShowFilterModal(false)} className="p-3 hover:bg-white rounded-full border border-slate-100 transition-all shadow-sm cursor-pointer"><X className="w-6 h-6 text-slate-400" /></button>
              </div>
              
              <div className="p-10 overflow-y-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Trạng thái</label>
                    <Select isMulti options={filterOptions.statuses} styles={customSelectStyles} placeholder="Chọn trạng thái..." value={filters.statuses} onChange={v => setFilters({...filters, statuses: v})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Sprint</label>
                    <Select isMulti options={filterOptions.sprints} styles={customSelectStyles} placeholder="Chọn Sprint..." value={filters.sprints} onChange={v => setFilters({...filters, sprints: v})} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Người đảm nhận</label>
                  <Select isMulti options={filterOptions.users} styles={customSelectStyles} placeholder="Chọn người làm..." value={filters.assigneeIds} onChange={v => setFilters({...filters, assigneeIds: v})} 
                    formatOptionLabel={opt => (
                      <div className="flex items-center gap-3">
                        {opt.avatar ? <img src={opt.avatar} className="w-6 h-6 rounded-full border border-slate-200" /> : <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center"><User className="w-3 h-3 text-slate-400" /></div>}
                        <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">Kiểm soát chất lượng dữ liệu</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'missing_description', label: 'THIẾU MÔ TẢ', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                      { key: 'missing_story_points', label: 'THIẾU SP', color: 'bg-orange-100 text-orange-700 border-orange-200' },
                      { key: 'missing_due_date', label: 'THIẾU HẠN', color: 'bg-rose-100 text-rose-700 border-rose-200' }
                    ].map(opt => (
                      <label key={opt.key} className={`flex flex-col items-center gap-3 p-5 rounded-[1.5rem] border transition-all cursor-pointer ${filters[opt.key] ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                        <span className={`px-2 py-1 rounded text-[9px] font-black border ${opt.color}`}>{opt.label}</span>
                        <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 cursor-pointer" checked={filters[opt.key]} onChange={e => setFilters({...filters, [opt.key]: e.target.checked})} />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-4">
                <button onClick={() => setFilters({ search: '', statuses: [], assigneeIds: [], sprints: [], missing_description: false, missing_story_points: false, missing_due_date: false })} className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors cursor-pointer">LÀM MỚI</button>
                <button onClick={() => setShowFilterModal(false)} className="px-10 py-4 bg-blue-600 text-white rounded-[1.2rem] text-sm font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 cursor-pointer">ÁP DỤNG</button>
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

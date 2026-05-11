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

const TaskRow = memo(React.forwardRef(({ task, onSelect }, ref) => {
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
      ref={ref}
      onClick={() => onSelect(task)}
      className="group hover:bg-slate-50 transition-all cursor-pointer border-b border-slate-50"
    >
      <td className="px-6 py-4 whitespace-nowrap">
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
      <td className="px-6 py-4">
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
      <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold text-slate-500">
        {task.status}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          {task.assignee_avatar ? (
            <img src={task.assignee_avatar} alt="" className="w-6 h-6 rounded-full border border-slate-200 shadow-sm" title={task.assignee_name} />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"><User className="w-3 h-3 text-slate-400" /></div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className={`text-xs font-bold ${hasSP ? 'text-blue-600' : 'text-slate-300'}`}>{task.story_points || '0'}</span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-medium text-slate-500">
        {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-medium text-slate-400">
        {task.start_date ? new Date(task.start_date).toLocaleDateString('vi-VN') : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {(!hasDesc || !hasSP || !hasDue) ? <AlertCircle className="w-4 h-4 text-orange-400 opacity-60" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 opacity-40" />}
      </td>
    </tr>
  );
}));

const TaskCard = memo(React.forwardRef(({ task, onSelect }, ref) => {
  const hasDesc = !!task.has_description;
  const hasSP = !!(task.story_points && parseFloat(task.story_points) > 0);
  const hasDue = !!task.due_date;

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onSelect(task)}
      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 active:scale-[0.98] transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${TYPE_COLORS[task.issue_type] || 'bg-slate-50'}`}>
            {task.issue_type}
          </span>
          <span className="text-xs font-mono font-bold text-slate-400">{task.issue_key}</span>
        </div>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
          {task.status}
        </span>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">{task.summary}</h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {!hasDesc && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-bold rounded border border-amber-100">Thiếu mô tả</span>}
          {!hasSP && <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-bold rounded border border-orange-100">Chưa SP</span>}
          {!hasDue && <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-bold rounded border border-rose-100">Thiếu hạn</span>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2">
          {task.assignee_avatar ? (
            <img src={task.assignee_avatar} className="w-5 h-5 rounded-full shadow-sm" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"><User className="w-3 h-3 text-slate-400" /></div>
          )}
          <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">{task.assignee_name || 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-0.5">Pts</span>
            <span className={`text-xs font-black ${hasSP ? 'text-blue-600' : 'text-slate-300'}`}>{task.story_points || 0}</span>
          </div>
          <div className="flex flex-col items-end border-l border-slate-100 pl-3">
            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-0.5">Due</span>
            <span className="text-xs font-bold text-slate-600">{task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '-'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}));

const TaskListView = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, standard: 0, missingDescription: 0, missingStoryPoints: 0, missingDueDate: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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

  const observer = React.useRef();
  const lastTaskElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

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

  const fetchTasks = useCallback(async (pageNum = 1, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const params = {
        page: pageNum, 
        limit: 50,
        search: filters.search?.trim() || undefined,
        status: filters.statuses.length > 0 ? filters.statuses.map(s => s.value).join(',') : undefined,
        assignee_id: filters.assigneeIds.length > 0 ? filters.assigneeIds.map(u => u.value).join(',') : undefined,
        sprint: filters.sprints.length > 0 ? filters.sprints.map(s => s.value).join(',') : undefined,
        missing_description: filters.missing_description || undefined,
        missing_story_points: filters.missing_story_points || undefined,
        missing_due_date: filters.missing_due_date || undefined
      };
      const { data } = await client.get('/tasks', { params });
      
      if (pageNum === 1) {
        setTasks(data.data);
      } else {
        setTasks(prev => [...prev, ...data.data]);
      }
      
      setHasMore(data.data.length === 50);
      if (data.stats) setStats(data.stats);
    } catch (err) { console.error(err); }
    finally { 
      setLoading(false); 
      setLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => fetchTasks(1, true), 400);
    return () => clearTimeout(timer);
  }, [filters, fetchTasks]);

  useEffect(() => {
    if (page > 1) fetchTasks(page);
  }, [page, fetchTasks]);

  const customSelectStyles = {
    control: (base) => ({ ...base, borderRadius: '12px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc', padding: '2px', boxShadow: 'none' }),
    option: (base, state) => ({ ...base, cursor: 'pointer', backgroundColor: state.isFocused ? '#eff6ff' : 'white' }),
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <LayoutList className="w-8 h-8 text-blue-600" /> Danh sách công việc
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-medium italic">Theo dõi chất lượng dữ liệu Jira</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 bg-white p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm flex-1 max-w-2xl justify-end">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
            <input 
              type="text" placeholder="Tìm kiếm..." 
              className="w-full pl-9 md:pl-11 pr-3 md:pr-4 py-2 md:py-2.5 bg-slate-50 border-none rounded-lg md:rounded-xl text-xs md:text-sm outline-none"
              value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <button 
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all"
          >
            <Filter className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden md:inline">Bộ lọc</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {[
          { label: 'Tổng số', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: LayoutList },
          { label: 'Đạt chuẩn', value: stats.standard, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2 },
          { label: 'Thiếu mô tả', value: stats.missingDescription, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Info },
          { label: 'Chưa SP', value: stats.missingStoryPoints, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: AlertCircle },
          { label: 'Thiếu hạn', value: stats.missingDueDate, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: Calendar },
        ].map((stat, idx) => (
          <div key={idx} className={`p-3 md:p-4 rounded-2xl border ${stat.bg} ${stat.border} shadow-sm`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[9px] md:text-[10px] font-bold uppercase ${stat.color}`}>{stat.label}</span>
              <stat.icon className={`w-3 h-3 md:w-4 h-4 ${stat.color}`} />
            </div>
            <div className="text-xl md:text-2xl font-black text-slate-800">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* View: Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase">Mã</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase">Tiêu đề</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Status</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">User</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">SP</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Due</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Start</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.map((task, index) => (
                <TaskRow 
                  key={task.id} 
                  ref={index === tasks.length - 1 ? lastTaskElementRef : null} 
                  task={task} 
                  onSelect={(t) => setSelectedTaskId(t.issue_key)} 
                />
              ))}
            </tbody>
          </table>
          {loading && <div className="py-20 text-center"><RefreshCw className="w-10 h-10 animate-spin mx-auto text-blue-100" /></div>}
        </div>
      </div>

      {/* View: Mobile Cards */}
      <div className="md:hidden space-y-4">
        {tasks.map((task, index) => (
          <TaskCard 
            key={task.id} 
            ref={index === tasks.length - 1 ? lastTaskElementRef : null} 
            task={task} 
            onSelect={(t) => setSelectedTaskId(t.issue_key)} 
          />
        ))}
        {loading && <div className="py-20 text-center"><RefreshCw className="w-10 h-10 animate-spin mx-auto text-blue-100" /></div>}
      </div>

      {loadingMore && <div className="py-6 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" /></div>}

      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowFilterModal(false)}>
            <motion.div 
              initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-xl rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800">Bộ lọc thông minh</h3>
                <X className="w-6 h-6 text-slate-400 cursor-pointer p-1" onClick={() => setShowFilterModal(false)} />
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Trạng thái</label>
                  <Select isMulti options={filterOptions.statuses} styles={customSelectStyles} value={filters.statuses} onChange={v => setFilters({...filters, statuses: v})} placeholder="Chọn status..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Sprint</label>
                  <Select isMulti options={filterOptions.sprints} styles={customSelectStyles} value={filters.sprints} onChange={v => setFilters({...filters, sprints: v})} placeholder="Chọn sprint..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Người đảm nhận</label>
                  <Select isMulti options={filterOptions.users} styles={customSelectStyles} value={filters.assigneeIds} onChange={v => setFilters({...filters, assigneeIds: v})} placeholder="Chọn người..." />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic block mb-3">Chất lượng dữ liệu</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'missing_description', label: 'Thiếu mô tả' },
                      { key: 'missing_story_points', label: 'Thiếu SP' },
                      { key: 'missing_due_date', label: 'Thiếu hạn' }
                    ].map(opt => (
                      <button 
                        key={opt.key}
                        onClick={() => setFilters({...filters, [opt.key]: !filters[opt.key]})}
                        className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition-all ${filters[opt.key] ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-100'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-6 bg-slate-50 flex justify-between gap-3">
                <button onClick={() => setFilters({ search: '', statuses: [], assigneeIds: [], sprints: [], missing_description: false, missing_story_points: false, missing_due_date: false })} className="text-sm font-bold text-slate-400 hover:text-slate-600">Làm mới</button>
                <button onClick={() => setShowFilterModal(false)} className="px-10 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all">Áp dụng</button>
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

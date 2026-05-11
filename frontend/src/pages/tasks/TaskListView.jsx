import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { LayoutGrid, Filter, Search, Loader2, ExternalLink, ChevronRight, Target, Hash, Calendar, Layers, X, User, Copy, CheckCircle2 } from 'lucide-react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import TaskDetailModal from '../../components/TaskDetailModal';
import Select, { components } from 'react-select';

// Memoize từng dòng Task để tránh re-render thừa gây lag
const TaskRow = memo(({ task, index, lastTaskRef, onSelect, getIssueTypeStyle }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(task.issue_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <tr 
      className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
      ref={lastTaskRef}
      onClick={() => onSelect(task.id)}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold relative">
        <div className="flex items-center gap-2 group/key">
          <span className="text-blue-600">{task.issue_key}</span>
          <button 
            onClick={handleCopy}
            className="p-1 opacity-0 group-hover/key:opacity-100 transition-all hover:bg-blue-50 rounded text-blue-400"
            title="Copy mã"
          >
            {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-sm font-medium text-slate-700 line-clamp-1 group-hover:text-blue-600 transition-colors">{task.summary}</p>
        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${getIssueTypeStyle(task.issue_type)}`}>
          {task.issue_type}
        </span>
      </td>
      <td className="px-6 py-4 text-center text-xs font-medium text-slate-500">
        {task.start_date ? new Date(task.start_date).toLocaleDateString('vi-VN') : '—'}
      </td>
      <td className="px-6 py-4 text-center text-xs font-medium text-slate-500">
        {task.due_date ? new Date(task.due_date).toLocaleDateString('vi-VN') : '—'}
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex justify-center">
          {task.assignee_avatar ? <img src={task.assignee_avatar} className="w-7 h-7 rounded-full border border-slate-100 shadow-sm" alt="" /> : <User className="w-5 h-5 text-slate-300" />}
        </div>
      </td>
      <td className="px-6 py-4 text-center text-xs font-medium text-slate-500">
        <span className="truncate max-w-[100px] inline-block">{task.sprint_name || '—'}</span>
      </td>
      <td className="px-6 py-4 text-center text-sm font-medium text-slate-400">{task.story_points || 0}</td>
      <td className="px-6 py-4 text-right">
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${task.status === 'Done' ? 'bg-green-50/50 border-green-200 text-green-600' : 'bg-blue-50/50 border-blue-200 text-blue-600'}`}>{task.status}</span>
      </td>
    </tr>
  );
});

const UserOption = (props) => (
  <components.Option {...props}>
    <div className="flex items-center gap-2 cursor-pointer">
      {props.data.avatar ? (
        <img src={props.data.avatar} className="w-5 h-5 rounded-full" alt="" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
          <User className="w-3 h-3" />
        </div>
      )}
      <span className="text-sm font-medium text-slate-700">{props.data.label}</span>
    </div>
  </components.Option>
);

const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    padding: '2px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    boxShadow: 'none',
    '&:hover': { border: '1px solid #cbd5e1' }
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: '#eff6ff',
    borderRadius: '6px',
    color: '#1e40af'
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: '#1e40af',
    fontWeight: '600',
    fontSize: '11px'
  })
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
    <td className="px-6 py-4 space-y-2">
      <div className="h-4 bg-slate-100 rounded w-full"></div>
      <div className="h-3 bg-slate-50 rounded w-1/3"></div>
    </td>
    <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-50 rounded w-16 mx-auto"></div></td>
    <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-50 rounded w-16 mx-auto"></div></td>
    <td className="px-6 py-4 text-center"><div className="h-7 w-7 bg-slate-50 rounded-full mx-auto"></div></td>
    <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-50 rounded w-20 mx-auto"></div></td>
    <td className="px-6 py-4 text-center"><div className="h-4 bg-slate-100 rounded w-10 mx-auto"></div></td>
    <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
  </tr>
);

const getIssueTypeStyle = (type) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('story')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (t.includes('bug')) return 'bg-red-50 text-red-600 border-red-100';
  if (t.includes('task')) return 'bg-blue-50 text-blue-600 border-blue-100';
  if (t.includes('sub')) return 'bg-slate-100 text-slate-500 border-slate-200';
  if (t.includes('epic')) return 'bg-purple-50 text-purple-600 border-purple-100';
  return 'bg-slate-50 text-slate-400 border-slate-100';
};

const TaskListView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({ statuses: [], assigneeIds: [], sprints: [], search: '' });
  const [filterOptions, setFilterOptions] = useState({ statuses: [], users: [], sprints: [] });
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const observer = useRef();

  const fetchFilterOptions = useCallback(async () => {
    try {
      const { data } = await client.get('/tasks/filters/options');
      if (data.status === 'success') {
        setFilterOptions(data.data);
      }
    } catch (err) {
      console.error('Lỗi lấy filter options:', err);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const fetchTasks = useCallback(async (targetPage, isReset = false) => {
    if (targetPage === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = {
        page: targetPage,
        limit: 30,
        search: filters.search?.trim() || undefined
      };

      // Chỉ gửi tham số nếu có giá trị
      if (filters.statuses?.length > 0) params.status = filters.statuses.map(s => s.value).join(',');
      if (filters.assigneeIds?.length > 0) params.assignee_id = filters.assigneeIds.map(u => u.value).join(',');
      if (filters.sprints?.length > 0) params.sprint = filters.sprints.map(sp => sp.value).join(',');

      console.log('Fetching tasks with params:', params);
      const { data } = await client.get('/tasks', { params });
      setTasks(prev => isReset ? data.data : [...prev, ...data.data]);
      setHasMore(data.data.length === 30);
    } catch (err) { console.error('Lỗi fetch tasks:', err); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [filters]);

  // Xử lý tìm kiếm và lọc kết hợp
  useEffect(() => {
    const timer = setTimeout(() => { 
      setPage(1);
      fetchTasks(1, true); 
    }, 400); // 400ms debounce cho cả search và filters
    return () => clearTimeout(timer);
  }, [filters.search, filters.statuses, filters.assigneeIds, filters.sprints]); // Loại bỏ fetchTasks khỏi dependency để tránh loop

  const lastTaskRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(p => {
          const next = p + 1;
          fetchTasks(next);
          return next;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore, fetchTasks]);

  return (
    <div className="max-w-full mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between bg-white px-6 py-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Danh sách công việc</h2>
          <p className="text-slate-500 text-xs">Theo dõi và cập nhật trạng thái từ Jira</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" placeholder="Tìm kiếm..." 
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56 transition-all"
              value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button 
            onClick={() => setShowFilterModal(true)}
            className={`p-2 rounded-lg border transition-all flex items-center gap-2 ${filters.statuses.length > 0 || filters.assigneeIds.length > 0 || filters.sprints.length > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            <Filter className="w-4 h-4" />
            {(filters.statuses.length + filters.assigneeIds.length + filters.sprints.length) > 0 && <span className="text-[10px] font-bold">{filters.statuses.length + filters.assigneeIds.length + filters.sprints.length}</span>}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed lg:table-auto">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap w-24 lg:w-auto">Mã</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap min-w-[200px]">Tiêu đề công việc</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap text-center">Ngày tạo</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap text-center">Hạn chót</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap text-center">Người làm</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap text-center">Sprint</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap text-center">SP</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && tasks.length === 0 ? (
              [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
            ) : tasks.length === 0 ? (
              <tr><td colSpan="8" className="py-20 text-center text-slate-400 text-sm">Không tìm thấy dữ liệu</td></tr>
            ) : (
              tasks.map((task, index) => (
                <TaskRow 
                  key={task.id}
                  task={task}
                  index={index}
                  lastTaskRef={index === tasks.length - 1 ? lastTaskRef : null}
                  onSelect={setSelectedTaskId}
                  getIssueTypeStyle={getIssueTypeStyle}
                />
              ))
            )}
          </tbody>
        </table>
        {loadingMore && <div className="py-4 flex justify-center"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>}
      </div>

      <AnimatePresence>
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-[2px]" onClick={() => setShowFilterModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6" onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Bộ lọc công việc</h3>
                <button onClick={() => setShowFilterModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Trạng thái</label>
                  <Select isMulti options={filterOptions.statuses.map(s => ({ value: s, label: s }))} styles={selectStyles} placeholder="Chọn..." value={filters.statuses} onChange={(v) => setFilters({...filters, statuses: v || []})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Sprint</label>
                  <Select isMulti options={filterOptions.sprints.map(sp => ({ value: sp, label: sp }))} styles={selectStyles} placeholder="Chọn Sprint..." value={filters.sprints} onChange={(v) => setFilters({...filters, sprints: v || []})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Người thực hiện</label>
                  <Select isMulti options={filterOptions.users.map(u => ({ value: u.id, label: u.name, avatar: u.avatar }))} components={{ Option: UserOption }} styles={selectStyles} placeholder="Chọn..." value={filters.assigneeIds} onChange={(v) => setFilters({...filters, assigneeIds: v || []})} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setFilters({ statuses: [], assigneeIds: [], sprints: [], search: '' }); setShowFilterModal(false); }} className="flex-1 py-2.5 bg-slate-50 text-slate-500 rounded-xl font-semibold text-sm border border-slate-200">Xóa hết</button>
                <button onClick={() => setShowFilterModal(false)} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-100">Áp dụng bộ lọc</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>{selectedTaskId && <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}</AnimatePresence>
    </div>
  );
};

export default TaskListView;

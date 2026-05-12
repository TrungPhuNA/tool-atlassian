import React, { useState } from 'react';
import { X, Share2, ChevronUp, ChevronDown, CheckCircle2, RefreshCw, ExternalLink, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import client from '../api/client';

const ALL_COLUMNS = [
    { id: 'issue_key', label: 'Mã công việc', default: true },
    { id: 'issue_type', label: 'Loại công việc', default: true },
    { id: 'summary', label: 'Tiêu đề', default: true },
    { id: 'status', label: 'Trạng thái', default: true },
    { id: 'assignee_name', label: 'Người thực hiện', default: true },
    { id: 'story_points', label: 'Story Points', default: true },
    { id: 'priority', label: 'Độ ưu tiên', default: false },
    { id: 'sprint_name', label: 'Sprint', default: true },
    { id: 'start_date', label: 'Ngày bắt đầu', default: false },
    { id: 'due_date', label: 'Hạn chót', default: true },
];

const ExportGoogleSheetModal = ({ filters, onClose, showToast }) => {
    const [selectedCols, setSelectedCols] = useState(
        ALL_COLUMNS.filter(c => c.default).map(c => c.id)
    );
    const [orderedCols, setOrderedCols] = useState(ALL_COLUMNS);
    const [exporting, setExporting] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [resultUrl, setResultUrl] = useState(null);

    const toggleCol = (id) => {
        setSelectedCols(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const moveCol = (index, direction) => {
        const newCols = [...orderedCols];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newCols.length) return;
        [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
        setOrderedCols(newCols);
    };

    const handleExport = async () => {
        if (selectedCols.length === 0) {
            showToast('error', 'Vui lòng chọn ít nhất một cột!');
            return;
        }

        setExporting(true);
        try {
            const activeCols = orderedCols
                .filter(col => selectedCols.includes(col.id))
                .map(col => ({ id: col.id, label: col.label }));

            const response = await client.post('/tasks/export/google-sheet', {
                columns: activeCols,
                filters: {
                    ...filters,
                    status: filters.statuses?.length > 0 ? filters.statuses.map(s => s.value).join(',') : undefined,
                    assignee_id: filters.assigneeIds?.length > 0 ? filters.assigneeIds.map(u => u.value).join(',') : undefined,
                    sprint: filters.sprints?.length > 0 ? filters.sprints.map(s => s.value).join(',') : undefined,
                },
                userEmail: userEmail || undefined,
                title: `Jira Export - ${new Date().toLocaleDateString('vi-VN')}`
            });

            const { spreadsheetUrl } = response.data.data;
            setResultUrl(spreadsheetUrl);
            showToast('success', 'Đã đẩy dữ liệu lên Google Sheets thành công!');
        } catch (err) {
            console.error('[Export Error]:', err);
            showToast('error', err.response?.data?.message || 'Lỗi khi xuất Google Sheets.');
        } finally {
            setExporting(false);
        }
    };

    if (resultUrl) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-slate-100"
                >
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-800">Xuất dữ liệu hoàn tất!</h3>
                        <p className="text-sm text-slate-500">File của bạn đã sẵn sàng trên Google Sheets.</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <a
                            href={resultUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                        >
                            <ExternalLink className="w-5 h-5" /> Mở Google Sheet
                        </a>
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all"
                        >
                            Đóng lại
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                            <Share2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Đẩy lên Google Sheets</h3>
                            <p className="text-xs font-semibold text-slate-400 italic">Tự động tạo file và phân quyền</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto max-h-[55vh] space-y-6 bg-slate-50/30">
                    {/* Share Email Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 italic flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> Chia sẻ với Email (Tùy chọn)
                        </label>
                        <input
                            type="email"
                            placeholder="example@gmail.com"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-400 leading-relaxed px-1">
                            * Nhập email của bạn để có quyền chỉnh sửa file. Nếu để trống, bạn chỉ có thể xem nếu file được để công khai.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs font-bold text-slate-500 italic">Cấu hình các cột</p>
                        <div className="space-y-2">
                            {orderedCols.map((col, index) => (
                                <div
                                    key={col.id}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${selectedCols.includes(col.id) ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                                >
                                    <button
                                        onClick={() => toggleCol(col.id)}
                                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedCols.includes(col.id) ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-50' : 'bg-white border-slate-300'}`}
                                    >
                                        {selectedCols.includes(col.id) && <CheckCircle2 className="w-4 h-4" />}
                                    </button>
                                    <span className={`flex-1 text-sm font-bold ${selectedCols.includes(col.id) ? 'text-slate-700' : 'text-slate-400'}`}>
                                        {col.label}
                                    </span>
                                    <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
                                        <button
                                            disabled={index === 0}
                                            onClick={() => moveCol(index, -1)}
                                            className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md text-slate-400 disabled:opacity-10 transition-all active:scale-90"
                                        >
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            disabled={index === orderedCols.length - 1}
                                            onClick={() => moveCol(index, 1)}
                                            className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md text-slate-400 disabled:opacity-10 transition-all active:scale-90"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-4 bg-white">
                    <button onClick={onClose} className="flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all">Hủy bỏ</button>
                    <button 
                        disabled={exporting || selectedCols.length === 0} 
                        onClick={handleExport} 
                        className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {exporting ? <><RefreshCw className="w-5 h-5 animate-spin" /> Đang xử lý...</> : <><Share2 className="w-5 h-5" /> Đẩy lên Google Sheets</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ExportGoogleSheetModal;

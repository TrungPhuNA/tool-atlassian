import React, { useState } from 'react';
import { X, Download, ChevronUp, ChevronDown, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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

/**
 * Modal cấu hình xuất dữ liệu Excel sử dụng ExcelJS
 * Định dạng 4 spaces theo yêu cầu người dùng
 */
const ExportExcelModal = ({ filters, onClose, showToast }) => {
    const [selectedCols, setSelectedCols] = useState(
        ALL_COLUMNS.filter(c => c.default).map(c => c.id)
    );
    const [orderedCols, setOrderedCols] = useState(ALL_COLUMNS);
    const [exporting, setExporting] = useState(false);

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
            showToast('error', 'Vui lòng chọn ít nhất một cột để xuất!');
            return;
        }

        setExporting(true);
        try {
            const params = {
                ...filters,
                page: 1,
                limit: 5000,
                status: filters.statuses?.length > 0 ? filters.statuses.map(s => s.value).join(',') : undefined,
                assignee_id: filters.assigneeIds?.length > 0 ? filters.assigneeIds.map(u => u.value).join(',') : undefined,
                sprint: filters.sprints?.length > 0 ? filters.sprints.map(s => s.value).join(',') : undefined,
            };

            const { data } = await client.get('/tasks', { params });
            const tasks = data.data;
            if (!tasks || tasks.length === 0) {
                showToast('info', 'Không có dữ liệu để xuất.');
                setExporting(false);
                return;
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Danh sách công việc');

            const activeCols = orderedCols.filter(col => selectedCols.includes(col.id));
            worksheet.columns = activeCols.map(col => ({
                header: col.label,
                key: col.id,
                width: col.id === 'summary' ? 50 : 20
            }));

            const headerRow = worksheet.getRow(1);
            headerRow.height = 30;
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF2563EB' }
                };
                cell.font = {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 11
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF1E40AF' } },
                    bottom: { style: 'thin', color: { argb: 'FF1E40AF' } },
                    left: { style: 'thin', color: { argb: 'FF1E40AF' } },
                    right: { style: 'thin', color: { argb: 'FF1E40AF' } }
                };
            });

            tasks.forEach(task => {
                const rowData = {};
                activeCols.forEach(col => {
                    let val = task[col.id];
                    if (col.id.includes('date') && val) {
                        val = new Date(val).toLocaleDateString('vi-VN');
                    } else if (col.id === 'story_points') {
                        val = val || 0;
                    }
                    rowData[col.id] = val || '';
                });

                const row = worksheet.addRow(rowData);

                if (selectedCols.includes('issue_key')) {
                    const keyCell = row.getCell('issue_key');
                    keyCell.value = {
                        text: task.issue_key,
                        hyperlink: `https://${task.jira_domain}/browse/${task.issue_key}`,
                        tooltip: 'Mở trên Jira'
                    };
                    keyCell.font = {
                        color: { argb: 'FF0066FF' },
                        underline: true
                    };
                }

                row.eachCell((cell, colNumber) => {
                    const colKey = activeCols[colNumber - 1].id;
                    if (['issue_key', 'issue_type', 'status', 'story_points', 'due_date'].includes(colKey)) {
                        cell.alignment = { horizontal: 'center' };
                    }
                });
            });

            worksheet.views = [
                {
                    state: 'frozen',
                    xSplit: 1,
                    ySplit: 1,
                    activePane: 'bottomRight'
                }
            ];

            const buffer = await workbook.xlsx.writeBuffer();
            const fileName = `Jira_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
            saveAs(new Blob([buffer]), fileName);

            showToast('success', `Đã xuất thành công ${tasks.length} công việc.`);
            onClose();
        } catch (err) {
            console.error('[Export Error]:', err);
            showToast('error', 'Lỗi khi tạo file Excel.');
        } finally {
            setExporting(false);
        }
    };

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
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <Download className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Xuất dữ liệu Excel</h3>
                            <p className="text-xs font-semibold text-slate-400 italic">Định dạng chuẩn - Cố định tiêu đề</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto max-h-[55vh] space-y-4 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-500 italic">Danh sách các trường dữ liệu</p>
                        <span className="text-[10px] text-slate-400 font-medium">Kéo thả hoặc nhấn mũi tên để sắp xếp</span>
                    </div>

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

                <div className="p-6 border-t border-slate-100 flex gap-4 bg-white">
                    <button onClick={onClose} className="flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all">Hủy bỏ</button>
                    <button disabled={exporting || selectedCols.length === 0} onClick={handleExport} className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95">
                        {exporting ? <><RefreshCw className="w-5 h-5 animate-spin" /> Đang chuẩn bị...</> : <><Download className="w-5 h-5" /> Tải Excel</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ExportExcelModal;

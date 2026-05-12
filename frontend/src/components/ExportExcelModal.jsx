import React, { useState } from 'react';
import { X, Download, ChevronUp, ChevronDown, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx-js-style';
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
 * Modal cấu hình xuất dữ liệu Excel
 * Cho phép chọn cột, sắp xếp thứ tự các cột và thực hiện xuất file
 */
const ExportExcelModal = ({ filters, onClose, showToast }) => {
  // Danh sách các ID cột được chọn
  const [selectedCols, setSelectedCols] = useState(
    ALL_COLUMNS.filter(c => c.default).map(c => c.id)
  );
  // Thứ tự hiển thị các cột (để sắp xếp)
  const [orderedCols, setOrderedCols] = useState(ALL_COLUMNS);
  const [exporting, setExporting] = useState(false);

  // Toggle chọn/bỏ chọn cột
  const toggleCol = (id) => {
    setSelectedCols(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  // Di chuyển vị trí cột (Lên/Xuống)
  const moveCol = (index, direction) => {
    const newCols = [...orderedCols];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;
    
    [newCols[index], newCols[targetIndex]] = [newCols[targetIndex], newCols[index]];
    setOrderedCols(newCols);
  };

  // Xử lý logic xuất file
  const handleExport = async () => {
    if (selectedCols.length === 0) {
      showToast('error', 'Vui lòng chọn ít nhất một cột để xuất!');
      return;
    }

    setExporting(true);
    try {
      // Lấy toàn bộ dữ liệu thỏa mãn bộ lọc hiện tại
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

      // 1. Chuẩn bị Header labels
      const headerLabels = orderedCols
        .filter(col => selectedCols.includes(col.id))
        .map(col => col.label);

      // 2. Chuẩn bị Data Row by Row (dùng Array of Arrays để dễ style)
      const aoaData = [headerLabels];

      tasks.forEach(task => {
        const row = [];
        orderedCols.forEach(col => {
          if (selectedCols.includes(col.id)) {
            let val = task[col.id];
            
            if (col.id === 'issue_key') {
              // Thêm hyperlink vào cột Mã công việc
              row.push({
                v: val,
                l: { Target: `https://${task.jira_domain}/browse/${val}`, Tooltip: 'Mở trên Jira' },
                s: { font: { color: { rgb: "0066FF" }, underline: true } }
              });
            } else if (col.id === 'summary') {
              row.push(task.summary);
            } else if (col.id.includes('date') && val) {
              row.push(new Date(val).toLocaleDateString('vi-VN'));
            } else if (col.id === 'story_points') {
              row.push(val || 0);
            } else {
              row.push(val || '');
            }
          }
        });
        aoaData.push(row);
      });

      // 3. Tạo Sheet
      const ws = XLSX.utils.aoa_to_sheet(aoaData);

      // 4. Định dạng Header (Dòng đầu tiên)
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1"; // VD: A1, B1...
        if (!ws[address]) continue;
        
        ws[address].s = {
          fill: { fgColor: { rgb: "2563EB" } }, // Màu xanh dương đậm (blue-600)
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }, // Chữ trắng, đậm
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "1E40AF" } },
            bottom: { style: "thin", color: { rgb: "1E40AF" } },
            left: { style: "thin", color: { rgb: "1E40AF" } },
            right: { style: "thin", color: { rgb: "1E40AF" } }
          }
        };
      }

      // 5. Điều chỉnh độ rộng cột tự động (cơ bản)
      const colWidths = headerLabels.map(label => ({ wch: Math.max(label.length + 5, 15) }));
      ws['!cols'] = colWidths;

      // 6. Freeze Panes: Cố định hàng 1 và cột 1
      ws['!views'] = [
        { state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2', activePane: 'bottomRight' }
      ];

      // 7. Xuất Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Danh sách công việc");
      XLSX.writeFile(wb, `Jira_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showToast('success', `Đã xuất thành công ${tasks.length} công việc kèm định dạng.`);
      onClose();
    } catch (err) {
      console.error('[Export] Error:', err);
      showToast('error', 'Có lỗi xảy ra khi xuất file Excel.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <Download className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Xuất dữ liệu Excel</h3>
              <p className="text-xs font-semibold text-slate-400">Tùy chỉnh cột và thứ tự xuất file</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Danh sách cột */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[55vh] space-y-3 bg-slate-50/30">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Danh sách các trường dữ liệu</p>
          <div className="space-y-2">
            {orderedCols.map((col, index) => (
              <div 
                key={col.id}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${selectedCols.includes(col.id) ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}
              >
                {/* Checkbox */}
                <button 
                  onClick={() => toggleCol(col.id)}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedCols.includes(col.id) ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-300 hover:border-blue-400'}`}
                >
                  {selectedCols.includes(col.id) && <CheckCircle2 className="w-4 h-4" />}
                </button>
                
                {/* Label */}
                <span className={`flex-1 text-sm font-bold ${selectedCols.includes(col.id) ? 'text-slate-700' : 'text-slate-400'}`}>
                  {col.label}
                </span>

                {/* Sắp xếp */}
                <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
                  <button 
                    disabled={index === 0}
                    onClick={() => moveCol(index, -1)}
                    className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md text-slate-400 disabled:opacity-10 transition-all"
                    title="Lên trên"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="w-px h-3 bg-slate-200 mx-0.5" />
                  <button 
                    disabled={index === orderedCols.length - 1}
                    onClick={() => moveCol(index, 1)}
                    className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md text-slate-400 disabled:opacity-10 transition-all"
                    title="Xuống dưới"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex gap-4 bg-white">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 bg-slate-50 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all active:scale-95"
          >
            Hủy bỏ
          </button>
          <button 
            disabled={exporting || selectedCols.length === 0}
            onClick={handleExport}
            className="flex-[2] py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {exporting ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Đang chuẩn bị dữ liệu...</>
            ) : (
              <><Download className="w-5 h-5" /> Tải về File Excel</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportExcelModal;

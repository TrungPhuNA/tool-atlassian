const googleSheetService = require('../services/google-sheet.service');
const jiraIssueRepository = require('../repositories/jira-issue.repository');

class ExportController {
    async exportToGoogleSheet(req, res, next) {
        try {
            const { columns, filters, title, userEmail } = req.body;

            // 1. Lấy dữ liệu tasks dựa trên filter
            // Tăng limit để lấy toàn bộ dữ liệu cần xuất (ví dụ tối đa 5000 dòng)
            const queryParams = { 
                ...filters, 
                limit: 5000, 
                page: 1 
            };
            const { rows } = await jiraIssueRepository.getAll(queryParams);

            if (!rows || rows.length === 0) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Không có dữ liệu để xuất'
                });
            }

            // 2. Chuẩn bị headers và rows cho Google Sheet
            const headers = columns.map(col => col.label);
            const dataRows = rows.map(task => {
                return columns.map(col => {
                    let val = task[col.id];
                    if (col.id.includes('date') && val) {
                        return new Date(val).toLocaleDateString('vi-VN');
                    }
                    if (col.id === 'story_points') {
                        return val || 0;
                    }
                    return val || '';
                });
            });

            // 3. Gọi service để tạo và đẩy dữ liệu
            const sheetTitle = title || `Jira Export ${new Date().toLocaleDateString('vi-VN')}`;
            const result = await googleSheetService.createAndExport(
                sheetTitle,
                headers,
                dataRows,
                userEmail
            );

            res.json({
                status: 'success',
                message: 'Đã đẩy dữ liệu lên Google Sheet thành công',
                data: result
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new ExportController();

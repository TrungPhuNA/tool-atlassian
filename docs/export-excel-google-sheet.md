# Tính năng Export dữ liệu ra Excel / Google Sheets

> Nguồn: Dự án Jira Reporting Tool (Interspace VN)
> Mục đích: Tham khảo để port sang dự án khác

---

## Kiến trúc tổng quan

Có **2 luồng export** độc lập:

| Luồng | Phía xử lý | Thư viện | Đầu ra |
|-------|-----------|---------|--------|
| **Excel (.xlsx)** | Client (Browser) | `exceljs` + `file-saver` | File `.xlsx` tải về máy |
| **Google Sheets** | Server (Node.js) | `googleapis` | Google Sheet (trực tuyến) |

Cả 2 luồng đều lấy dữ liệu từ **API `/api/v1/tasks`** (hoặc repository trực tiếp), support filter động, chọn cột, sắp xếp thứ tự cột.

---

## 1. Luồng Excel (.xlsx) — Client-side

### Sơ đồ luồng

```
[TaskListView] → mở [ExportExcelModal]
                   ↓
           Chọn cột, sắp xếp
                   ↓
           Gọi API GET /api/v1/tasks (với filters hiện tại)
                   ↓
           Tạo Workbook ExcelJS trên browser
                   ↓
           Download file .xlsx bằng file-saver
```

### File liên quan

| File | Vai trò |
|------|---------|
| `frontend/src/components/ExportExcelModal.jsx` | Modal UI + xử lý export |
| `frontend/src/pages/tasks/TaskListView.jsx` | Nơi gọi modal, truyền filters |
| `frontend/src/api/client.js` | Axios instance gọi API |

### Dependencies (frontend/package.json)

```json
"exceljs": "^4.4.0",
"file-saver": "^2.0.5"
```

### Cách hoạt động

**Bước 1 — Cấu hình cột:**
```js
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
    { id: 'needs_solution_discussion', label: 'Solution', default: true },
    { id: 'note', label: 'Note', default: true },
];
```
- `default: true` → cột được chọn mặc định khi mở modal.
- User có thể bật/tắt cột và sắp xếp thứ tự (kéo lên/xuống).

**Bước 2 — Gọi API lấy dữ liệu:**
```js
const params = {
    ...filters,
    page: 1,
    limit: 5000,  // hardcode limit tối đa
    status: filters.statuses?.map(s => s.value).join(','),
    // ... các filter khác
};
const { data } = await client.get('/tasks', { params });
```

**Bước 3 — Tạo Excel Workbook:**
```js
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Danh sách công việc');

// Config độ rộng cột
worksheet.columns = activeCols.map(col => ({
    header: col.label,
    key: col.id,
    width: col.id === 'summary' ? 50 
        : (col.id === 'needs_solution_discussion' ? 12 
        : (col.id === 'note' ? 30 : 20))
}));
```

**Bước 4 — Format header:**
```js
const headerRow = worksheet.getRow(1);
headerRow.height = 30;
headerRow.eachCell((cell) => {
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }  // Blue background
    };
    cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },    // White text
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
```

**Bước 5 — Transform dữ liệu từng dòng:**
```js
tasks.forEach(task => {
    const rowData = {};
    activeCols.forEach(col => {
        let val = task[col.id];
        // Cột issue_type có parent → thêm mũi tên
        if (col.id === 'issue_type' && task.parent_id) {
            val = '↳ ' + val;
        }
        // Cột date → format locale vi-VN
        if (col.id.includes('date') && val) {
            val = new Date(val).toLocaleDateString('vi-VN');
        }
        // Story points mặc định 0
        else if (col.id === 'story_points') {
            val = val || 0;
        }
        // Boolean → Có/Không
        else if (col.id === 'needs_solution_discussion') {
            val = val ? 'Có' : 'Không';
        }
        rowData[col.id] = val || '';
    });

    const row = worksheet.addRow(rowData);

    // issue_key → hyperlink
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
});
```

**Bước 6 — Freeze panes + Download:**
```js
// Freeze dòng 1 và cột 1
worksheet.views = [{
    state: 'frozen',
    xSplit: 1,
    ySplit: 1,
    activePane: 'bottomRight'
}];

// Ghi buffer và download
const buffer = await workbook.xlsx.writeBuffer();
const fileName = `Jira_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
saveAs(new Blob([buffer]), fileName);
```

---

## 2. Luồng Google Sheets — Server-side

### Sơ đồ luồng

```
[ExportGoogleSheetModal] → POST /api/v1/tasks/export/google-sheet
                                  ↓
                     [export.controller.js]
                         - Lọc columns + filters
                         - Gọi repository lấy tasks
                         - Transform dữ liệu
                                  ↓
                     [google-sheet.service.js]
                         - Auth bằng Service Account
                         - Tạo spreadsheet / tìm sheet cũ
                         - Đẩy dữ liệu lên sheet
                         - Format header (màu, frozen, column width)
                         - Share quyền Writer cho user email
                                  ↓
                     Trả về spreadsheetUrl cho frontend
```

### File liên quan

| File | Vai trò |
|------|---------|
| `api/controllers/export.controller.js` | Nhận request, transform data, gọi service |
| `api/services/google-sheet.service.js` | Tương tác Google Sheets API |
| `api/routes/task.route.js` | Định tuyến `POST /export/google-sheet` |
| `frontend/src/components/ExportGoogleSheetModal.jsx` | UI config + gọi API |

### Dependencies (api/package.json)

```json
"googleapis": "^171.4.0"
```

### Service Account

File credentials: `api/gg-sheet.json` (Google Service Account key file)

Scopes yêu cầu:
```
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive
```

### Backend chi tiết

**Route** (`api/routes/task.route.js`):
```js
router.post('/export/google-sheet', authMiddleware, exportController.exportToGoogleSheet);
```

**Controller** (`api/controllers/export.controller.js`):

```js
async exportToGoogleSheet(req, res, next) {
    const { columns, filters, title, userEmail, spreadsheetId } = req.body;

    // Fetch data với limit lớn (5000), order parent_first
    const queryParams = {
        ...filters,
        limit: 5000,
        page: 1,
        order_by: 'parent_first'
    };
    const { rows } = await jiraIssueRepository.getAll(queryParams);

    // Transform columns → headers, tasks → dataRows
    const headers = columns.map(col => col.label);
    const dataRows = rows.map(task => {
        return columns.map(col => {
            let val = task[col.id];
            if (col.id === 'issue_type' && task.parent_id) val = '↳ ' + val;
            if (col.id === 'issue_key') {
                return `=HYPERLINK("https://${task.jira_domain}/browse/${val}", "${val}")`;
            }
            if (col.id.includes('date') && val) {
                return new Date(val).toLocaleDateString('vi-VN');
            }
            if (col.id === 'story_points') return val || 0;
            if (col.id === 'needs_solution_discussion') return val ? 'Có' : 'Không';
            return val || '';
        });
    });

    const finalSpreadsheetId = spreadsheetId || process.env.GOOGLE_SHEET_ID;
    const result = await googleSheetService.createAndExport(
        title, headers, dataRows, userEmail, finalSpreadsheetId
    );

    res.json({ status: 'success', data: result });
}
```

**Google Sheet Service** (`api/services/google-sheet.service.js`):

```js
const { google } = require('googleapis');

class GoogleSheetService {
    constructor() {
        this.auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, '../gg-sheet.json'),
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ],
        });
    }

    async createAndExport(title, headers, rows, userEmail, existingSpreadsheetId) {
        const sheets = google.sheets({ version: 'v4', auth: this.auth });
        const drive = google.drive({ version: 'v3', auth: this.auth });

        // 1. Tạo mới hoặc dùng spreadsheet có sẵn
        let spreadsheetId = existingSpreadsheetId;
        if (!spreadsheetId) {
            const spreadsheet = await sheets.spreadsheets.create({
                resource: { properties: { title } },
                fields: 'spreadsheetId,spreadsheetUrl'
            });
            spreadsheetId = spreadsheet.data.spreadsheetId;
        }

        // 2. Tạo sheet tab với tên ai-YYYY-MM-DD
        const sheetName = `ai-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        // Kiểm tra trùng → clear cũ, không trùng → add sheet mới

        // 3. Đẩy dữ liệu
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [headers, ...rows] }
        });

        // 4. Format header: blue bg, white bold, centered
        // 5. Freeze row 1 + column 1
        // 6. Set column C width = 450px
        // 7. Share quyền writer cho userEmail (nếu có)

        return { spreadsheetId, spreadsheetUrl };
    }
}
```

### Format header (Google Sheets API)

Sử dụng `sheets.spreadsheets.batchUpdate()` với 3 requests:

1. **repeatCell** — Header row: blue background `(0.15, 0.39, 0.92)`, white bold text, center alignment
2. **updateSheetProperties** — Freeze: `frozenRowCount: 1, frozenColumnCount: 1`
3. **updateDimensionProperties** — Cột C (index 2): `pixelSize: 450`

---

## 3. Data Transform — Các mapping chung

Cả 2 luồng đều áp dụng cùng logic transform:

| Field | Xử lý |
|-------|-------|
| `issue_type` + có `parent_id` | Thêm prefix `↳ ` |
| `issue_key` | Hyperlink đến Jira: `https://{domain}/browse/{key}` |
| `date` fields | `new Date(val).toLocaleDateString('vi-VN')` → dd/mm/yyyy |
| `story_points` | `val \|\| 0` — mặc định 0 |
| `needs_solution_discussion` | `val ? 'Có' : 'Không'` — boolean → tiếng Việt |
| Các field còn lại | `val \|\| ''` — fallback empty string |

### Lưu ý về hyperlink

- **ExcelJS**: Dùng object `{ text, hyperlink, tooltip }`
- **Google Sheets**: Dùng formula `=HYPERLINK("url", "text")` với `valueInputOption: 'USER_ENTERED'`

---

## 4. Filter mapping (Frontend → API)

Khi gọi API export, filters từ UI được map như sau:

```js
const params = {
    // ...các filter gốc từ component

    // Multi-select → comma-separated string
    status: filters.statuses?.map(s => s.value).join(','),
    assignee_id: filters.assigneeIds?.map(u => u.value).join(','),
    sprint: filters.sprints?.map(s => s.value).join(','),

    // Bỏ qua filter 'all'
    task_hierarchy: filters.task_hierarchy !== 'all' ? filters.task_hierarchy : undefined,

    // Pagination
    page: 1,
    limit: 5000,   // Tối đa 5000 dòng
};
```

---

## 5. Porting Checklist

Khi port sang dự án khác, cần:

### Excel (.xlsx) path
- [ ] Cài `exceljs` và `file-saver`
- [ ] Copy component `ExportExcelModal.jsx` (chỉnh lại `ALL_COLUMNS` và API URL)
- [ ] Đảm bảo có API endpoint trả về danh sách tasks theo filters

### Google Sheets path
- [ ] Cài `googleapis`
- [ ] Tạo Service Account trên Google Cloud Console, tải file JSON key
- [ ] Copy service `google-sheet.service.js` (sửa đường dẫn key file)
- [ ] Copy controller `export.controller.js`
- [ ] Thêm route `POST /export/google-sheet`
- [ ] Copy component `ExportGoogleSheetModal.jsx` (chỉnh API URL)
- [ ] Enable Google Sheets API và Google Drive API trên GCP project
- [ ] (Optional) Set `GOOGLE_SHEET_ID` trong `.env` nếu muốn dùng spreadsheet mặc định

### Tùy chỉnh
- **Column definitions**: Sửa mảng `ALL_COLUMNS` trong cả 2 modal
- **Format**: Điều chỉnh màu sắc, font, border trong code format
- **Locale**: Thay `vi-VN` bằng locale phù hợp
- **Sheet tab name**: Sửa prefix `ai-` trong `google-sheet.service.js`
- **Max rows**: Sửa `limit: 5000` trong controller và modal

---

## 6. API Reference

### POST /api/v1/tasks/export/google-sheet

**Request body:**
```json
{
    "columns": [{ "id": "issue_key", "label": "Mã công việc" }, ...],
    "filters": { "status": "Done,In Progress", "assignee_id": "abc,def" },
    "title": "Jira Export - 09/06/2026",
    "userEmail": "user@example.com",
    "spreadsheetId": "1BxiMVs0XRA5nxtd94G..."
}
```

**Response:**
```json
{
    "status": "success",
    "message": "Đã đẩy dữ liệu lên Google Sheet thành công",
    "data": {
        "spreadsheetId": "...",
        "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/.../edit#gid=123"
    }
}
```

### GET /api/v1/tasks

Dùng chung cho Excel export path (frontend gọi trực tiếp).

Query params: `status`, `assignee_id`, `sprint`, `task_hierarchy`, `search`, `page`, `limit`, ...

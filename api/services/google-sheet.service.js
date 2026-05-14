const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class GoogleSheetService {
    constructor() {
        // Sử dụng file JSON vật lý để đảm bảo tính ổn định cao nhất
        const keyPath = path.join(__dirname, '../gg-sheet.json');
        
        this.auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ],
        });
    }

    /**
     * Tạo một Spreadsheet mới và đẩy dữ liệu vào
     * @param {string} title Tiêu đề của file
     * @param {Array} headers Mảng các tiêu đề cột ['Mã', 'Tiêu đề', ...]
     * @param {Array} rows Mảng các dòng dữ liệu [[val1, val2], ...]
     * @param {string} userEmail Email của người dùng để share quyền (optional)
     * @param {string} existingSpreadsheetId ID của spreadsheet có sẵn (optional)
     */
    async createAndExport(title, headers, rows, userEmail = null, existingSpreadsheetId = null) {
        const sheets = google.sheets({ version: 'v4', auth: this.auth });
        const drive = google.drive({ version: 'v3', auth: this.auth });

        try {
            let spreadsheetId = existingSpreadsheetId;
            let spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

            // 1. Tạo spreadsheet mới nếu không truyền ID
            if (!spreadsheetId) {
                const spreadsheet = await sheets.spreadsheets.create({
                    resource: {
                        properties: {
                            title: title,
                        },
                    },
                    fields: 'spreadsheetId,spreadsheetUrl',
                });
                spreadsheetId = spreadsheet.data.spreadsheetId;
                spreadsheetUrl = spreadsheet.data.spreadsheetUrl;
            }

            // 2. Lấy thông tin Spreadsheet để kiểm tra các Tab hiện có
            const spreadsheetData = await sheets.spreadsheets.get({ spreadsheetId });
            const existingSheets = spreadsheetData.data.sheets;
            
            const now = new Date();
            const sheetName = `ai-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            
            let targetSheetId;
            const duplicateSheet = existingSheets.find(s => s.properties.title === sheetName);

            if (duplicateSheet) {
                // Nếu trùng tên, lấy ID cũ và xóa dữ liệu cũ
                targetSheetId = duplicateSheet.properties.sheetId;
                await sheets.spreadsheets.values.clear({
                    spreadsheetId,
                    range: `${sheetName}!A1:Z1000`, // Xóa vùng dữ liệu cũ
                });
            } else {
                // Nếu không trùng, tạo Tab mới
                const addSheetResponse = await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    resource: {
                        requests: [
                            {
                                addSheet: {
                                    properties: {
                                        title: sheetName,
                                    },
                                },
                            },
                        ],
                    },
                });
                targetSheetId = addSheetResponse.data.replies[0].addSheet.properties.sheetId;
            }

            // 3. Đẩy dữ liệu vào Tab (mới hoặc cũ đã clear)
            const values = [headers, ...rows];
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A1`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: values,
                },
            });

            // 4. Format header cho Tab đó
            await this.formatHeader(spreadsheetId, targetSheetId, headers.length);

            // 4. Share quyền cho user nếu có email
            if (userEmail) {
                await drive.permissions.create({
                    fileId: spreadsheetId,
                    requestBody: {
                        type: 'user',
                        role: 'writer',
                        emailAddress: userEmail,
                    },
                });
            } else {
                // Nếu không có email cụ thể, có thể set public link nếu muốn (nhưng không an toàn)
                // Ở đây mình mặc định chỉ share nếu có email
            }

            return {
                spreadsheetId,
                spreadsheetUrl: `${spreadsheetUrl}#gid=${targetSheetId}`,
            };
        } catch (error) {
            if (error.response && error.response.data) {
                console.error('Google Sheet API Detail Error:', JSON.stringify(error.response.data, null, 2));
            }
            console.error('Google Sheet Service Error:', error);
            throw error;
        }
    }

    async formatHeader(spreadsheetId, sheetId, columnCount) {
        const sheets = google.sheets({ version: 'v4', auth: this.auth });
        
        // Chuyển số cột thành mã chữ (ví dụ 3 -> C)
        const endColumnIndex = columnCount;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [
                    {
                        repeatCell: {
                            range: {
                                sheetId: sheetId,
                                startRowIndex: 0,
                                endRowIndex: 1,
                                startColumnIndex: 0,
                                endColumnIndex: endColumnIndex,
                            },
                            cell: {
                                userEnteredFormat: {
                                    backgroundColor: { red: 0.15, green: 0.39, blue: 0.92 }, // Blue
                                    textFormat: {
                                        foregroundColor: { red: 1, green: 1, blue: 1 },
                                        bold: true,
                                        fontSize: 11
                                    },
                                    horizontalAlignment: 'CENTER',
                                    verticalAlignment: 'MIDDLE'
                                }
                            },
                            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
                        }
                    },
                    {
                        updateSheetProperties: {
                            properties: {
                                sheetId: sheetId,
                                gridProperties: {
                                    frozenRowCount: 1,
                                    frozenColumnCount: 1
                                }
                            },
                            fields: 'gridProperties.frozenRowCount,gridProperties.frozenColumnCount'
                        }
                    },
                    {
                        updateDimensionProperties: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'COLUMNS',
                                startIndex: 2, // Cột C (Tiêu đề)
                                endIndex: 3
                            },
                            properties: {
                                pixelSize: 450 // Độ rộng pixel
                            },
                            fields: 'pixelSize'
                        }
                    }
                ]
            }
        });
    }
}

module.exports = new GoogleSheetService();

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class GoogleSheetService {
    constructor() {
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
     */
    async createAndExport(title, headers, rows, userEmail = null) {
        const sheets = google.sheets({ version: 'v4', auth: this.auth });
        const drive = google.drive({ version: 'v3', auth: this.auth });

        try {
            // 1. Tạo spreadsheet mới
            const spreadsheet = await sheets.spreadsheets.create({
                resource: {
                    properties: {
                        title: title,
                    },
                },
                fields: 'spreadsheetId,spreadsheetUrl',
            });

            const spreadsheetId = spreadsheet.data.spreadsheetId;
            const spreadsheetUrl = spreadsheet.data.spreadsheetUrl;

            // 2. Đẩy dữ liệu vào (Sheet1 mặc định)
            const values = [headers, ...rows];
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'A1',
                valueInputOption: 'RAW',
                resource: {
                    values: values,
                },
            });

            // 3. Format header (optional but makes it look professional)
            await this.formatHeader(spreadsheetId, headers.length);

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
                spreadsheetUrl,
            };
        } catch (error) {
            if (error.response && error.response.data) {
                console.error('Google Sheet API Detail Error:', JSON.stringify(error.response.data, null, 2));
            }
            console.error('Google Sheet Service Error:', error);
            throw error;
        }
    }

    async formatHeader(spreadsheetId, columnCount) {
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
                                sheetId: 0,
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
                                sheetId: 0,
                                gridProperties: {
                                    frozenRowCount: 1
                                }
                            },
                            fields: 'gridProperties.frozenRowCount'
                        }
                    }
                ]
            }
        });
    }
}

module.exports = new GoogleSheetService();

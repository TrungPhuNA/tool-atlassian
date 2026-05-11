const axios = require('axios');

class JiraService {
  /**
   * Tạo Basic Auth header từ email và token
   */
  getAuthHeader(email, token) {
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    return { 
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Test kết nối tới Jira
   */
  async testConnection(domain, email, token) {
    try {
      const url = `https://${domain}/rest/api/2/myself`;
      console.log(`[JiraService] Testing connection to: ${url}`);
      const response = await axios.get(url, {
        headers: this.getAuthHeader(email, token)
      });
      return { success: true, user: response.data };
    } catch (error) {
      console.error('[JiraService] Test connection failed:', error.response?.status, error.message);
      return { success: false, message: error.response?.data?.errorMessages?.[0] || error.message };
    }
  }

  /**
   * Tìm kiếm issues bằng JQL
   */
  /**
   * Lấy danh sách tất cả các Board
   */
  async getAllBoards(domain, email, token) {
    try {
      let allBoards = [];
      let startAt = 0;
      let isLast = false;

      while (!isLast) {
        const url = `https://${domain}/rest/agile/1.0/board`;
        console.log(`[JiraService] Fetching boards at offset ${startAt}...`);
        const response = await axios.get(url, { 
          headers: this.getAuthHeader(email, token),
          params: { startAt, maxResults: 50 }
        });
        
        allBoards = allBoards.concat(response.data.values || []);
        isLast = response.data.isLast;
        startAt += 50;
        
        if (allBoards.length > 500) break; // Safeguard
      }

      return allBoards;
    } catch (error) {
      console.error('[JiraService] Get boards failed:', error.message);
      return [];
    }
  }

  /**
   * Lấy Issues theo Board ID
   */
  async getIssuesByBoard(domain, email, token, boardId, startAt = 0, maxResults = 50) {
    try {
      const url = `https://${domain}/rest/agile/1.0/board/${boardId}/issue`;
      const response = await axios.get(url, {
        params: { 
          startAt, 
          maxResults,
          fields: '*all'
        },
        headers: this.getAuthHeader(email, token)
      });
      return response.data;
    } catch (error) {
      console.error(`[JiraService] Get issues for board ${boardId} failed:`, error.message);
      return { issues: [] };
    }
  }

  /**
   * Lấy chi tiết 1 issue (Giữ nguyên hoặc cập nhật fields)
   */
  async getIssue(domain, email, token, issueKey) {
    try {
      const url = `https://${domain}/rest/api/3/issue/${issueKey}`;
      const response = await axios.get(url, {
        headers: this.getAuthHeader(email, token)
      });
      return response.data;
    } catch (error) {
      console.error(`[JiraService] Fetch issue ${issueKey} failed:`, error.message);
      throw error;
    }
  }
}

module.exports = new JiraService();

const axios = require('axios');

/**
 * Service xử lý việc gửi thông báo đến các nền tảng bên ngoài (Google Chat, Slack, ...)
 */
class NotificationService {
    /**
     * Gửi tin nhắn đến Google Chat Webhook
     * @param {string} text Nội dung tin nhắn
     * @returns {Promise<any>}
     */
    static async sendGoogleChat(text) {
        const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;
        if (!webhookUrl) {
            console.error('GOOGLE_CHAT_WEBHOOK_URL is not configured');
            return null;
        }

        try {
            const response = await axios.post(webhookUrl, { text });
            return response.data;
        } catch (error) {
            console.error('Error sending Google Chat notification:', error.message);
            throw error;
        }
    }

    /**
     * Gửi thông báo chi tiết về một task
     * @param {Object} task Thông tin task (issue_key, summary, status, ...)
     * @returns {Promise<any>}
     */
    static async sendTaskNotification(task) {
        const message = `🔔 *Thông báo Task Jira*\n\n` +
                        `*Tiêu đề:* ${task.summary}\n` +
                        `*Mã task:* ${task.issue_key}\n` +
                        `*Kết quả:* ${task.status}\n` +
                        `*Link:* https://${task.jira_domain}/browse/${task.issue_key}`;
        
        return this.sendGoogleChat(message);
    }
}

module.exports = NotificationService;

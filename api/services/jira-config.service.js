const jiraConfigRepository = require('../repositories/jira-config.repository');
const jiraService = require('./jira.service');

class JiraConfigService {
  async getConfig() {
    return jiraConfigRepository.getConfig();
  }

  async saveConfig(data) {
    // Làm sạch domain: xóa https:// và dấu / ở cuối nếu có
    if (data.jira_domain) {
      data.jira_domain = data.jira_domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }
    return jiraConfigRepository.createOrUpdate(data);
  }

  async testConnection() {
    const config = await jiraConfigRepository.getConfig();
    if (!config) {
      throw new Error('Chưa cấu hình Jira');
    }

    return jiraService.testConnection(
      config.jira_domain,
      config.jira_email,
      config.api_token
    );
  }
}

module.exports = new JiraConfigService();

const jiraConfigService = require('../services/jira-config.service');

class JiraConfigController {
  async getConfig(req, res, next) {
    try {
      const config = await jiraConfigService.getConfig();
      res.json({ status: 'success', data: config });
    } catch (err) {
      next(err);
    }
  }

  async saveConfig(req, res, next) {
    try {
      const result = await jiraConfigService.saveConfig(req.body);
      res.json({ status: 'success', data: result, message: 'Lưu cấu hình thành công' });
    } catch (err) {
      next(err);
    }
  }

  async testConnection(req, res, next) {
    try {
      const result = await jiraConfigService.testConnection();
      if (result.success) {
        res.json({ status: 'success', message: 'Kết nối Jira thành công', data: result.user });
      } else {
        res.status(400).json({ status: 'fail', message: result.message });
      }
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new JiraConfigController();

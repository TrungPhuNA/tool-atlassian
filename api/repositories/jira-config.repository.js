const { JiraConfig } = require('../models');

class JiraConfigRepository {
  async getConfig() {
    return JiraConfig.findOne({
      order: [['created_at', 'DESC']]
    });
  }

  async createOrUpdate(data) {
    const existing = await this.getConfig();
    if (existing) {
      return existing.update(data);
    }
    return JiraConfig.create(data);
  }
}

module.exports = new JiraConfigRepository();

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JiraConfig extends Model {
    static associate(models) {
      // define association here
    }
  }
  JiraConfig.init({
    jira_domain: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tên miền Jira (VD: company.atlassian.net)'
    },
    jira_email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Email dùng để xác thực API'
    },
    api_token: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'API Token đã được mã hóa'
    }
  }, {
    sequelize,
    modelName: 'JiraConfig',
    tableName: 'jira_configs',
    underscored: true,
  });
  return JiraConfig;
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jira_configs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: 'ID chính'
      },
      jira_domain: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Tên miền Jira (VD: company.atlassian.net)'
      },
      jira_email: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Email dùng để xác thực API'
      },
      api_token: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'API Token đã được mã hóa'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('jira_configs');
  }
};

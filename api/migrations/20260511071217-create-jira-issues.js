'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jira_issues', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: 'ID chính'
      },
      issue_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Key của Jira (VD: PROJ-123)'
      },
      issue_type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Loại issue (Story, Task, Bug, Sub-task...)'
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID của task cha nếu là sub-task'
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Tiêu đề công việc'
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Trạng thái hiện tại'
      },
      assignee_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID Jira của người thực hiện'
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Ngày bắt đầu'
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Hạn hoàn thành (Due date)'
      },
      priority: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Mức độ ưu tiên'
      },
      jira_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Payload gốc từ Jira'
      },
      last_sync_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Lần cuối đồng bộ'
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

    // Add index for searching
    await queryInterface.addIndex('jira_issues', ['issue_key']);
    await queryInterface.addIndex('jira_issues', ['parent_id']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('jira_issues');
  }
};

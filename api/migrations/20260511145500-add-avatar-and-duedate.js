'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm cột assignee_avatar
    await queryInterface.addColumn('jira_issues', 'assignee_avatar', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'assignee_name'
    });

    // Thêm cột due_date
    await queryInterface.addColumn('jira_issues', 'due_date', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'status'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('jira_issues', 'assignee_avatar');
    await queryInterface.removeColumn('jira_issues', 'due_date');
  }
};

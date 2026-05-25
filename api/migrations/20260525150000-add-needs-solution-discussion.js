'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('jira_issues', 'needs_solution_discussion', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      after: 'has_due_date',
      comment: 'Có cần trao đổi giải pháp hay không'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('jira_issues', 'needs_solution_discussion');
  }
};

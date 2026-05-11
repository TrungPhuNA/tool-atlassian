'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('jira_issues', 'assignee_name', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'assignee_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('jira_issues', 'assignee_name');
  }
};

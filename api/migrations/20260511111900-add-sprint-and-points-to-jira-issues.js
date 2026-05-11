'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('jira_issues', 'sprint_name', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Tên Sprint hiện tại'
    });
    await queryInterface.addColumn('jira_issues', 'story_points', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Điểm Story Point'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('jira_issues', 'sprint_name');
    await queryInterface.removeColumn('jira_issues', 'story_points');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        comment: 'ID chính'
      },
      display_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Tên hiển thị nhân sự'
      },
      jira_account_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Account ID trên Jira Cloud'
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Email nhân sự'
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Trạng thái theo dõi'
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
    await queryInterface.dropTable('employees');
  }
};

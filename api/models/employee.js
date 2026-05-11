'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    static associate(models) {
      // define association here
    }
  }
  Employee.init({
    display_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Tên hiển thị nhân sự'
    },
    jira_account_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Account ID trên Jira Cloud'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Email nhân sự'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Trạng thái theo dõi'
    }
  }, {
    sequelize,
    modelName: 'Employee',
    tableName: 'employees',
    underscored: true,
  });
  return Employee;
};

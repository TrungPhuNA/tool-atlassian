'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JiraIssue extends Model {
    static associate(models) {
      // Quan hệ cha con (sub-tasks)
      JiraIssue.hasMany(models.JiraIssue, {
        foreignKey: 'parent_id',
        as: 'subtasks'
      });
      JiraIssue.belongsTo(models.JiraIssue, {
        foreignKey: 'parent_id',
        as: 'parent'
      });
    }
  }
  JiraIssue.init({
    issue_key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Key của Jira (VD: PROJ-123)'
    },
    issue_type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Loại issue (Story, Task, Bug, Sub-task...)'
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID của task cha nếu là sub-task'
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Tiêu đề công việc'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Trạng thái hiện tại'
    },
    assignee_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID Jira của người thực hiện'
    },
    assignee_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên hiển thị của người thực hiện'
    },
    assignee_avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL avatar của người thực hiện'
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày bắt đầu'
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Hạn hoàn thành (Due date)'
    },
    priority: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Mức độ ưu tiên'
    },
    jira_data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Payload gốc từ Jira'
    },
    last_sync_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Lần cuối đồng bộ'
    },
    sprint_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên Sprint hiện tại'
    },
    story_points: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Điểm Story Point'
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Hạn chót công việc'
    },
    jira_domain: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tên miền Jira để tạo link'
    }
  }, {
    sequelize,
    modelName: 'JiraIssue',
    tableName: 'jira_issues',
    underscored: true,
  });
  return JiraIssue;
};

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SyncJob extends Model {
    static associate(models) {
      // define association here
    }
  }
  SyncJob.init({
    status: {
      type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'stopped'),
      defaultValue: 'pending'
    },
    total_boards: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    synced_boards: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    new_issues_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    updated_issues_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'SyncJob',
    tableName: 'sync_jobs',
    underscored: true,
  });
  return SyncJob;
};

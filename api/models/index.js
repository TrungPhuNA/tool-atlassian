'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;

// BẮT BUỘC LẤY TỪ .ENV NẾU CÓ
if (process.env.DB_NAME) {
  console.log('🔌 Khởi tạo Sequelize bằng biến môi trường (.env)');
  sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASS, 
    {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      dialect: process.env.DB_DIALECT || 'mysql',
      logging: env === 'development' ? console.log : false,
      // Chỉ lấy các cấu hình phụ từ config.json (như underscored, timestamps)
      define: config.define || {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    }
  );
} else {
  // Fallback duy nhất nếu không tìm thấy bất kỳ biến .env nào liên quan đến DB
  console.log('⚠️ Không tìm thấy biến môi trường DB, nạp từ config.json');
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

const { User } = require('../models');
const jwt = require('jsonwebtoken');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ where: { username } });

      if (!user || !user.validPassword(password)) {
        return res.status(401).json({ status: 'fail', message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        status: 'success',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            role: user.role
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const { username, password, full_name, role } = req.body;
      
      // Kiểm tra user tồn tại
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ status: 'fail', message: 'Tên đăng nhập đã tồn tại' });
      }

      const user = await User.create({ username, password, full_name, role });
      
      res.json({
        status: 'success',
        message: 'Tạo người dùng thành công',
        data: { id: user.id, username: user.username, role: user.role }
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req, res) {
    res.json({
      status: 'success',
      data: {
        id: req.user.id,
        username: req.user.username,
        full_name: req.user.full_name,
        role: req.user.role
      }
    });
  }
}

module.exports = new AuthController();

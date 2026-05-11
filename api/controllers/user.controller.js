const { User } = require('../models');

class UserController {
  async getAll(req, res, next) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['id', 'DESC']]
      });
      res.json({ status: 'success', data: users });
    } catch (err) { next(err); }
  }

  async create(req, res, next) {
    try {
      const user = await User.create(req.body);
      res.json({ status: 'success', message: 'Tạo user thành công', data: { id: user.id, username: user.username } });
    } catch (err) { next(err); }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({ status: 'fail', message: 'Không thể tự xóa chính mình' });
      }
      await User.destroy({ where: { id } });
      res.json({ status: 'success', message: 'Đã xóa người dùng' });
    } catch (err) { next(err); }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ status: 'fail', message: 'User không tồn tại' });
      
      await user.update(req.body);
      res.json({ status: 'success', message: 'Cập nhật thành công' });
    } catch (err) { next(err); }
  }
}

module.exports = new UserController();

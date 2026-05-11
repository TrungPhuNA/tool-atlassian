const { User } = require('./models');

async function seedAdmin() {
  try {
    const admin = await User.findOne({ where: { username: 'admin' } });
    if (!admin) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        full_name: 'Quản trị viên',
        role: 'admin'
      });
      console.log('✅ Đã tạo tài khoản admin mặc định: admin / admin123');
    } else {
      console.log('ℹ️ Tài khoản admin đã tồn tại.');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi tạo admin:', err);
    process.exit(1);
  }
}

seedAdmin();

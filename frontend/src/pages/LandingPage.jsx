import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, BarChart3, Zap, Clock, ChevronRight, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = ({ user, onLogout }) => {
  const isAdmin = user?.role === 'admin';
  const dashboardLink = isAdmin ? '/admin/config' : '/tasks';

  const handleLogout = () => {
    onLogout();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 uppercase">Jira Insight</span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{user.role}</span>
                  <span className="text-sm font-bold text-slate-900">{user.full_name || user.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    to={dashboardLink} 
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    Vào Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-8"
          >
            <Zap className="w-3 h-3" /> Giải pháp tối ưu cho Interspace VN
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8"
          >
            Quản trị dự án Jira <br/> <span className="text-blue-600 italic">theo cách chuyên nghiệp</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
          >
            Đồng bộ dữ liệu thời gian thực, tự động hóa báo cáo hiệu suất và giúp đội ngũ tập trung vào những giá trị cốt lõi nhất.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Bắt đầu ngay <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: ShieldCheck, title: "Bảo mật tuyệt đối", desc: "Sử dụng API Token chuẩn của Atlassian và mã hóa JWT 2 lớp." },
            { icon: Clock, title: "Thời gian thực", desc: "Đồng bộ ngầm dữ liệu từ Jira giúp báo cáo luôn chính xác từng phút." },
            { icon: BarChart3, title: "Báo cáo thông minh", desc: "Phân tích Story Point, Sprint và tiến độ công việc tự động." }
          ].map((f, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <f.icon className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

import React, { useState, useEffect } from 'react';
import { Globe, ShieldCheck, Send, Loader2 } from 'lucide-react';
import client from '../../api/client';

const AdminJiraConfig = ({ showToast }) => {
  const [config, setConfig] = useState({ jira_domain: '', jira_email: '', api_token: '' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await client.get('/admin/jira/config');
      if (data.data) setConfig(data.data);
    } catch (err) { console.error(err); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/admin/jira/config', config);
      showToast('success', 'Đã lưu cấu hình Jira thành công!');
    } catch (err) { showToast('error', 'Lỗi khi lưu cấu hình.'); }
    finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await client.post('/admin/jira/config', config);
      const { data } = await client.post('/admin/jira/test-connection');
      showToast('success', `Kết nối thành công! Chào ${data.data.displayName}`);
    } catch (err) { showToast('error', 'Kết nối thất bại. Vui lòng kiểm tra lại Token.'); }
    finally { setTesting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-800">Cấu hình kết nối Jira</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">Jira Domain</label>
              <input 
                type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                placeholder="tencongty.atlassian.net"
                value={config.jira_domain} onChange={e => setConfig({...config, jira_domain: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 ml-1">Email quản trị</label>
              <input 
                type="email" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                placeholder="admin@email.com"
                value={config.jira_email} onChange={e => setConfig({...config, jira_email: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 ml-1">API Token</label>
            <input 
              type="password" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium tracking-wider"
              placeholder="••••••••••••••••"
              value={config.api_token} onChange={e => setConfig({...config, api_token: e.target.value})}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-100">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Lưu cấu hình
            </button>
            <button type="button" onClick={handleTest} disabled={testing} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-green-600" />} Thử kết nối
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex items-start gap-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Hướng dẫn bảo mật</h4>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            API Token nên được tạo từ trang quản trị Atlassian. Chúng tôi mã hóa dữ liệu này trước khi lưu trữ để đảm bảo an toàn tuyệt đối cho hệ thống của bạn.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminJiraConfig;

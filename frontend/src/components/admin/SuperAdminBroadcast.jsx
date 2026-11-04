// frontend/src/components/admin/SuperAdminBroadcast.jsx
import React, { useState } from 'react';
import { Send, Megaphone, CheckCircle2, Users, Store } from 'lucide-react';
import API from '../../services/api';

const SuperAdminBroadcast = () => {
  const [message, setMessage] = useState('');
  const [targetUsers, setTargetUsers] = useState(true);
  const [targetVendors, setTargetVendors] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('Please type a message before sending.');
      return;
    }

    let target = 'both';
    if (targetUsers && !targetVendors) target = 'users';
    if (!targetUsers && targetVendors) target = 'vendors';
    if (!targetUsers && !targetVendors) {
      showToast('Please select at least one target audience.');
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      
const response = await API.post('/admin/broadcast', { message });
const data = response.data;
      if (data.success) {
        showToast('Broadcast notification dispatched successfully!');
        setMessage('');

        // Trigger local browser notification test for admin
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('FCOMMERCE', { body: message });
        }
      } else {
        showToast(data.message || 'Failed to send broadcast.');
      }
    } catch (err) {
      showToast('Network error while dispatching broadcast.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E4D58] text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-black flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-[#1E4D58]" />
          Broadcast & Browser Notifications Hub
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Send real-time browser notifications and platform announcements to active shoppers and registered merchants.
        </p>
      </div>

      {/* BROADCAST FORM */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
        <form onSubmit={handleSendBroadcast} className="space-y-5">
          
          {/* TARGET AUDIENCE SELECTION */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider">Select Target Audience</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition ${
                targetUsers ? 'border-[#1E4D58] bg-[#1E4D58]/5 ring-2 ring-[#1E4D58]/20' : 'border-slate-200 bg-slate-50'
              }`}>
                <input 
                  type="checkbox" 
                  checked={targetUsers} 
                  onChange={e => setTargetUsers(e.target.checked)} 
                  className="w-4 h-4 text-[#1E4D58] rounded cursor-pointer"
                />
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#1E4D58]" />
                  <span className="text-xs font-black text-slate-900">All Active Shoppers & Users</span>
                </div>
              </label>

              <label className={`flex items-center space-x-3 p-4 rounded-2xl border cursor-pointer transition ${
                targetVendors ? 'border-[#1E4D58] bg-[#1E4D58]/5 ring-2 ring-[#1E4D58]/20' : 'border-slate-200 bg-slate-50'
              }`}>
                <input 
                  type="checkbox" 
                  checked={targetVendors} 
                  onChange={e => setTargetVendors(e.target.checked)} 
                  className="w-4 h-4 text-[#1E4D58] rounded cursor-pointer"
                />
                <div className="flex items-center space-x-2">
                  <Store className="w-4 h-4 text-[#1E4D58]" />
                  <span className="text-xs font-black text-slate-900">All Registered Vendors / Merchants</span>
                </div>
              </label>
            </div>
          </div>

          {/* MESSAGE TEXTAREA */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider">Broadcast Announcement Text</label>
            <textarea 
              rows="5"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your announcement or alert message here... (Triggers browser notifications for online recipients)"
              className="w-full p-4 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1E4D58]/20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3.5 px-6 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Broadcasting Notification...' : 'Send Broadcast Notification Now'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminBroadcast;
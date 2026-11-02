// frontend/src/components/UserSettingsPage.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function UserSettingsPage({ currentUser, onUserUpdated, onBackToMarketplace }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [customPreferences, setCustomPreferences] = useState(currentUser?.preferences || '');
  
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });
    setLoading(true);

    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(
            'http://localhost:5000/api/auth/profile',
        {
          name,
          phone,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
          preferences: customPreferences,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setStatusMsg({ type: 'success', text: '✓ Account settings & database updated successfully!' });
        if (onUserUpdated && response.data.user) {
          onUserUpdated(response.data.user);
        }
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile settings in database.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6 mt-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-black uppercase text-slate-900">User Account Settings</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage your profile and database preferences</p>
        </div>
        {onBackToMarketplace && (
          <button
            onClick={onBackToMarketplace}
            className="text-xs font-bold text-[#1E4D58] hover:underline cursor-pointer"
          >
            ← Back to Shop
          </button>
        )}
      </div>

      {statusMsg.text && (
        <div className={`p-3 rounded-2xl text-xs font-bold border ${
          statusMsg.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Custom Notes / Shopping Preferences (Saved to DB)</label>
          <textarea
            rows="3"
            placeholder="Add delivery instructions, preferred brands, or custom notes here..."
            value={customPreferences}
            onChange={(e) => setCustomPreferences(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
          ></textarea>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <span className="text-[10px] font-black text-slate-400 uppercase block">Change Password (Optional)</span>
          
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs uppercase rounded-xl shadow-md cursor-pointer transition"
        >
          {loading ? 'Saving to Database...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}
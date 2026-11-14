import React, { useState } from 'react';
import axios from 'axios';
import API from '../../services/api';

export default function StoreSettingsPage({ currentStore, currentUser, onStoreUpdated, onBack }) {
  const [name, setName] = useState(currentStore?.name || '');
  const [address, setAddress] = useState(currentStore?.address || '');
  const [phoneNumber, setPhoneNumber] = useState(currentStore?.phoneNumber || currentUser?.phone || '');
  const [logoUrl, setLogoUrl] = useState(currentStore?.logoUrl || '');
  const [landmark, setLandmark] = useState(currentStore?.landmark || '');
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleSaveStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {    
const response = await API.put('/stores/profile', {
  userId: currentUser?.id,
  name,
  address,
  phoneNumber,
  logoUrl,
  landmark,
});
const data = response.data;

      if (response.data.success) {
        setStatusMsg({ type: 'success', text: '✓ Store settings updated successfully!' });
        if (onStoreUpdated) {
          onStoreUpdated(response.data.store);
        }
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update store settings.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6 mt-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-black uppercase text-slate-900">Store Settings</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Manage your storefront name, location, and logo</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="text-xs font-bold text-[#1E4D58] hover:underline cursor-pointer">
            ← Back
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

      <form onSubmit={handleSaveStore} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Store Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              required
            />
          </div>
          
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Store Physical Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Bole Medhanialem, Addis Ababa"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Landmark / Area Description</label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Edna Mall"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Logo URL / Image Link</label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.jpg"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          title="Save Store Changes"
          aria-label="Save Store Changes"
          className="w-full py-3.5 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs uppercase rounded-xl shadow-md cursor-pointer transition"
        >
          {loading ? 'Saving Store...' : 'Save Store Settings'}
        </button>
      </form>
    </div>
  );
}
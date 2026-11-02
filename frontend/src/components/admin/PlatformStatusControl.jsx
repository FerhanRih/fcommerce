// frontend/src/components/admin/PlatformStatusControl.jsx
import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Power } from 'lucide-react';

export default function PlatformStatusControl() {
  const [storefrontOpen, setStorefrontOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Fetch current status on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/settings/platform-status')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStorefrontOpen(data.storefrontOpen);
      })
      .catch(err => console.error('Failed to fetch platform status:', err));
  }, []);

  const handleToggle = async (newStatus) => {
    setLoading(true);
    setStatusMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/settings/platform-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ storefrontOpen: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setStorefrontOpen(data.storefrontOpen);
        setStatusMsg(data.message);
      }
    } catch (err) {
      setStatusMsg('Failed to update platform status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`border rounded-2xl p-5 shadow-sm transition ${
      storefrontOpen ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${storefrontOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            <Power className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Platform Kill-Switch / Maintenance Mode
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              {storefrontOpen 
                ? 'Storefront is currently OPEN. Customers can place orders normally.' 
                : 'Storefront is PAUSED. New order requests are blocked with a maintenance notice.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleToggle(true)}
            disabled={loading || storefrontOpen}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
              storefrontOpen 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            🟢 Open Store
          </button>
          
          <button
            onClick={() => handleToggle(false)}
            disabled={loading || !storefrontOpen}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer ${
              !storefrontOpen 
                ? 'bg-rose-600 text-white shadow-md animate-pulse' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            🔴 Pause / Maintenance
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="mt-3 p-2.5 rounded-xl text-xs font-bold bg-white/80 border border-slate-200 text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}
    </div>
  );
}
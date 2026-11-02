// frontend/src/components/admin/SuperAdminDeliveryPricing.jsx
import React, { useState, useEffect } from 'react';
import { Truck, Save, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function SuperAdminDeliveryPricing({ onBack }) {
  const [fees, setFees] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const fetchFees = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/settings/delivery-fees');
      const data = await res.json();
      if (data.success) {
        setFees(data.fees);
      }
    } catch (err) {
      console.error('Error fetching delivery fees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleChange = (subcity, value) => {
    setFees({ ...fees, [subcity]: Number(value) });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:5000/api/settings/delivery-fees', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fees })
      });
      const data = await res.json();
      if (data.success) {
        setToast('Delivery price list updated successfully!');
        setTimeout(() => setToast(''), 3000);
      } else {
        alert(data.message || 'Failed to update prices.');
      }
    } catch (err) {
      alert('Network error while saving delivery prices.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-12 pb-12 text-center text-xs font-bold text-slate-400">
        Loading delivery pricing manager...
      </div>
    );
  }

  return (
    <div className="pt-6 pb-16 px-4 sm:px-6 max-w-2xl mx-auto space-y-6">
      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-black flex items-center space-x-2 shadow-sm animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* HEADER CARD WITH BACK BUTTON */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition cursor-pointer flex items-center gap-1.5 text-xs font-black shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hub</span>
            </button>
          )}
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#1E4D58]" />
              Delivery Price List Manager
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">Configure flat or promotional delivery rates across Addis Ababa subcities.</p>
          </div>
        </div>
      </div>

     {/* PRICING FORM CARD */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {Object.entries(fees).map(([subcity, price]) => (
            <div key={subcity} className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-4">
              <span className="text-xs font-black text-slate-800 flex-1 pr-2">{subcity}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => handleChange(subcity, e.target.value)}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-right focus:outline-none focus:border-[#1E4D58]"
                  required
                />
                <span className="text-[10px] font-black text-slate-400">ETB</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-2xl transition cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-2 py-3.5 bg-[#1E4D58] hover:bg-[#163C45] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save & Publish New Rates'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
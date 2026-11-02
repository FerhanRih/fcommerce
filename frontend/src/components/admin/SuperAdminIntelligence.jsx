// frontend/src/components/admin/SuperAdminIntelligence.jsx
import React, { useState, useEffect } from 'react';
import { Award, Store, User, Package, RefreshCw, TrendingUp } from 'lucide-react';

const SuperAdminIntelligence = () => {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchIntelligence = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/marketplace-intelligence', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setIntelligence(data.intelligence);
      }
    } catch (error) {
      console.error('Intelligence Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center space-x-2 text-slate-500 font-bold text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-[#1E4D58]" />
          <span>Analyzing marketplace performance...</span>
        </div>
      </div>
    );
  }

  const { topStore, topBuyer, topProduct } = intelligence || {};

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Marketplace Intelligence Leaderboard</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Top-performing merchants, highest-volume buyers, and trending catalog items.</p>
        </div>
        <button
          onClick={fetchIntelligence}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* TOP SELLER STORE */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Top Seller Store</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
              <Store className="w-5 h-5" />
            </div>
          </div>
          {topStore ? (
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900">{topStore.storeName}</h3>
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl text-xs">
                <p className="text-slate-600 font-bold">Owner: <span className="text-slate-900">{topStore.ownerName}</span></p>
                <p className="text-slate-600 font-bold">Phone: <span className="text-[#1E4D58] font-mono font-black">{topStore.phone}</span></p>
                <p className="text-slate-600 font-bold">Total Orders: <span className="text-emerald-600 font-black">{topStore.ordersFulfilled}</span></p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center font-bold">No store sales recorded yet.</p>
          )}
        </div>

        {/* TOP BUYER */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Top Volume Buyer</span>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
              <User className="w-5 h-5" />
            </div>
          </div>
          {topBuyer ? (
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900">{topBuyer.name}</h3>
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl text-xs">
                <p className="text-slate-600 font-bold">Phone: <span className="text-[#1E4D58] font-mono font-black">{topBuyer.phone}</span></p>
                <p className="text-slate-600 font-bold">Total Orders Placed: <span className="text-indigo-600 font-black">{topBuyer.totalOrders}</span></p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center font-bold">No buyer transactions recorded yet.</p>
          )}
        </div>

        {/* TOP SOLD PRODUCT */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Top Selling Product</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          {topProduct ? (
            <div className="space-y-3">
              <h3 className="text-base font-black text-slate-900">{topProduct.title}</h3>
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl text-xs">
                <p className="text-slate-600 font-bold">Category: <span className="text-slate-900">{topProduct.category}</span></p>
                <p className="text-slate-600 font-bold">Unit Price: <span className="text-emerald-600 font-black">{Number(topProduct.price).toLocaleString()} ETB</span></p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center font-bold">No product sales logged yet.</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default SuperAdminIntelligence;
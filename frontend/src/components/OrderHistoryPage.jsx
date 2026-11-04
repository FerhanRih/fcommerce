// frontend/src/components/OrderHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../services/api';

export default function OrderHistoryPage({ currentUser, onBackToMarketplace }) {
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentUser?.phone) return;
      try {
        const token = localStorage.getItem('token');
const response = await API.get(`/orders/user/${currentUser.phone}`);
const data = response.data;
        if (response.data.success) {
          // Filter only delivered orders
          const delivered = (response.data.orders || []).filter(o => o.status === 'delivered');
          setHistoryOrders(delivered);
        }
      } catch (err) {
        console.error('Error fetching order history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [currentUser?.phone]);

  const downloadOrderSummary = (ord) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(ord, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Order_${ord.id}_Summary.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={onBackToMarketplace} className="text-xs font-bold text-slate-700 hover:text-[#1E4D58] transition cursor-pointer">
            ← Back to Marketplace
          </button>
          <span className="text-xs font-black text-[#1E4D58] uppercase">Order Archive</span>
        </div>

        <div>
          <h1 className="text-xl font-black text-slate-900">Delivered Order History</h1>
          <p className="text-xs text-slate-500">Archived records are stored for 30 days. You can download summaries anytime.</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white rounded-3xl border">Loading history...</div>
        ) : (
          historyOrders.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200">
              <p className="text-xs font-bold text-slate-500">No completed orders found in history.</p>
            </div>
          ) : (
            historyOrders.map((ord) => (
              <div key={ord.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase">Delivered Order #{ord.id}</span>
                    <h3 className="text-sm font-black text-slate-900">{ord.store?.storeName || 'Partner Store'}</h3>
                  </div>
                  <button
                    onClick={() => downloadOrderSummary(ord)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                  >
                     Download Summary
                  </button>
                </div>

                <div className="text-xs space-y-1 font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Total Paid (Products):</span>
                    <span className="font-bold text-slate-900">{Number(ord.subtotal).toLocaleString()} ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>{Number(ord.deliveryFee || 200).toLocaleString()} ETB</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 rounded-2xl">
                   Retention Notice: This record will be automatically deleted in 30 days.
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
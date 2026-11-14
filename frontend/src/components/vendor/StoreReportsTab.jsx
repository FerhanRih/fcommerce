import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Calendar, RefreshCw, Eye, 
  ShoppingCart, AlertCircle, CheckCircle2, Clock 
} from 'lucide-react';
import API from '../../services/api';

const StoreReportsTab = ({ currentStore }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null); // Item Detail Modal

  const fetchReports = async () => {
    if (!currentStore?.id) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (phoneQuery.trim()) params.append('phone', phoneQuery.trim());
      if (selectedDate) params.append('date', selectedDate);

      const response = await API.get(`/orders/vendor/${currentStore.id}/reports?${params.toString()}`);
      if (response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (error) {
      // Fallback to standard vendor orders if dedicated report endpoint isn't wired yet
      try {
        const fallbackRes = await API.get(`/orders/vendor/${currentStore.id}`);
        if (fallbackRes.data.success) {
          // Client-side 30-day filter & search fallback
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const filtered = (fallbackRes.data.orders || []).filter(order => {
            const orderDate = new Date(order.createdAt);
            if (orderDate < thirtyDaysAgo) return false;
            
            if (selectedDate) {
              const dStr = orderDate.toISOString().split('T')[0];
              if (dStr !== selectedDate) return false;
            }
            if (phoneQuery && !String(order.customerPhone || '').includes(phoneQuery)) return false;
            if (searchQuery) {
              const q = searchQuery.toLowerCase();
              const matchName = String(order.customerName || '').toLowerCase().includes(q);
              const matchId = String(order.id).includes(q);
              if (!matchName && !matchId) return false;
            }
            return true;
          });
          setOrders(filtered);
        }
      } catch (fbError) {
        console.error('Fetch Reports Error:', fbError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounced reactive search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, phoneQuery, selectedDate, currentStore?.id]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER & 30-DAY NOTICE */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Sales & Order Audit Reports</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Complete transaction ledger from initial request to delivery. 
            <span className="text-amber-600 font-bold ml-1">Reports automatically prune after 30 days.</span>
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customer name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1E4D58]"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by phone number..."
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1E4D58]"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-[#1E4D58]"
            />
          </div>

          <button
            type="submit"
            className="py-3 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-xl uppercase tracking-wider transition cursor-pointer"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* LINE-STYLE ORDERS LEDGER TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#1E4D58]" />
            <span>Loading 30-day report ledger...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 border border-dashed border-slate-200 rounded-2xl text-center space-y-2 m-6">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">No order reports found within the last 30 days</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Lifecycle Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((order) => {
                  const customerName = order.User?.name || order.customerName || 'Customer';
                  const customerPhone = order.User?.phone || order.customerPhone || 'N/A';
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-black text-[#1E4D58]">#{order.id}</td>
                      <td className="p-4 font-extrabold text-slate-900">{customerName}</td>
                      <td className="p-4 text-slate-600 font-mono">{customerPhone}</td>
                      <td className="p-4 font-black text-slate-900">{Number(order.totalAmount || 0).toLocaleString()} ETB</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md font-black text-[10px] uppercase ${
                          order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'payment_verified' || order.status === 'verified' ? 'bg-sky-100 text-sky-800' :
                          order.status === 'accepted' ? 'bg-indigo-100 text-indigo-800' :
                          order.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] rounded-lg inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Item Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ITEM DETAIL BREAKDOWN MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full relative space-y-4 shadow-2xl border border-slate-200">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-black text-base cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-base font-black text-[#1E4D58]">Order Report Breakdown #{selectedOrder.id}</h3>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Customer Name</span>
                <p className="font-extrabold text-slate-900">{selectedOrder.User?.name || selectedOrder.customerName || 'Customer'}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Phone Number</span>
                <p className="text-slate-700 font-mono">{selectedOrder.User?.phone || selectedOrder.customerPhone || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-400">Ordered Items Ledger</h4>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {selectedOrder.items && (Array.isArray(selectedOrder.items) ? selectedOrder.items : JSON.parse(selectedOrder.items || '[]')).length > 0 ? (
                  (Array.isArray(selectedOrder.items) ? selectedOrder.items : JSON.parse(selectedOrder.items || '[]')).map((item, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between text-xs items-center">
                      <div>
                        <p className="font-extrabold text-slate-900">{item.title || item.name || 'Product Item'}</p>
                        <p className="text-slate-400 text-[10px]">Qty: {item.approvedQuantity !== undefined ? item.approvedQuantity : (item.quantity || 1)} @ {Number(item.price || 0).toLocaleString()} ETB</p>
                      </div>
                      <span className="font-black text-slate-800">{Number((item.price || 0) * (item.approvedQuantity !== undefined ? item.approvedQuantity : (item.quantity || 1))).toLocaleString()} ETB</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No item records attached.</p>
                )}
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Delivery Fee</span>
                <span>{Number(selectedOrder.deliveryFee || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-100">
                <span>Grand Total</span>
                <span className="text-[#1E4D58]">{Number(selectedOrder.totalAmount || 0).toLocaleString()} ETB</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StoreReportsTab;
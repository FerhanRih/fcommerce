// frontend/src/components/admin/SuperAdminAllOrders.jsx
import React, { useState, useEffect } from 'react';
import { 
  ListOrdered, Search, Calendar, RefreshCw, Eye, 
  Store, User, ShoppingCart, CheckCircle2 
} from 'lucide-react';
import API from '../../services/api';

const SuperAdminAllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [phoneQuery, setPhoneQuery] = useState('');
  const [nameQuery, setNameQuery] = useState(''); // covers store or user name
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null); // Detail Modal

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (phoneQuery.trim()) params.append('phone', phoneQuery.trim());
      if (nameQuery.trim()) params.append('search', nameQuery.trim());
      if (selectedDate) params.append('date', selectedDate);

      const response = await API.get(`/admin/all-orders?${params.toString()}`);
      const data = response.data;
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Fetch All Orders Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Trigger fetch whenever any filter/search parameter changes with a smooth debounce effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAllOrders();
    }, 300); // 300ms debounce prevents excessive requests while typing

    return () => clearTimeout(delayDebounceFn);
  }, [phoneQuery, nameQuery, selectedDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAllOrders();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Master All Orders Audit Ledger</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Complete historical audit trail across all marketplace transactions, stores, and buyers.
          </p>
        </div>

        <button
          onClick={fetchAllOrders}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by phone number..."
              value={phoneQuery}
              onChange={(e) => setPhoneQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1E4D58]"
            />
          </div>

          <div className="relative">
            <Store className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search store or user name..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
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
            Filter Ledger
          </button>
        </form>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#1E4D58]" />
            <span>Searching database records...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 border border-dashed border-slate-200 rounded-2xl text-center space-y-2 m-6">
            <ListOrdered className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">No orders match your filter criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase">
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Store Name</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((order) => {
                  const storeName = order.Store?.store_name || order.Store?.name || 'Store';
                  const customerName = order.User?.name || order.customerName || 'Customer';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-black text-[#1E4D58]">#{order.id}</td>
                      <td className="p-4 font-extrabold text-slate-900">{storeName}</td>
                      <td className="p-4 text-slate-700">{customerName}</td>
                      <td className="p-4 font-black text-slate-900">{Number(order.totalAmount || order.amount || 0).toLocaleString()} ETB</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md font-black text-[10px] uppercase ${
                          order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'verified' ? 'bg-sky-100 text-sky-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] rounded-lg inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
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

      {/* ORDER DETAIL BREAKDOWN MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full relative space-y-4 shadow-2xl border border-slate-200">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-black text-base cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-base font-black text-[#1E4D58]">Master Order Audit #{selectedOrder.id}</h3>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Store</span>
                <p className="font-extrabold text-slate-900">{selectedOrder.Store?.store_name || selectedOrder.Store?.name || 'Store'}</p>
                <p className="text-slate-500">
                  {selectedOrder.Store?.phoneNumber || selectedOrder.Store?.user?.phone || selectedOrder.Store?.User?.phone || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Customer</span>
                <p className="font-extrabold text-slate-900">{selectedOrder.User?.name || 'Customer'}</p>
                <p className="text-slate-500">{selectedOrder.User?.phone || selectedOrder.customerPhone || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase text-slate-400">Ordered Items Breakdown</h4>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {selectedOrder.items && (Array.isArray(selectedOrder.items) ? selectedOrder.items : JSON.parse(selectedOrder.items || '[]')).length > 0 ? (
                  (Array.isArray(selectedOrder.items) ? selectedOrder.items : JSON.parse(selectedOrder.items || '[]')).map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between text-xs">
                      <div>
                        <p className="font-extrabold text-slate-900">{item.title || item.name || 'Product Item'}</p>
                        <p className="text-slate-400 text-[10px]">Quantity: {item.quantity || 1}</p>
                      </div>
                      <span className="font-black text-slate-800">{Number((item.price || 0) * (item.quantity || 1)).toLocaleString()} ETB</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">No item records attached.</p>
                )}
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-200 flex justify-between text-xs font-black">
              <span>Grand Total Amount</span>
              <span className="text-[#1E4D58] text-sm">{Number(selectedOrder.totalAmount || selectedOrder.amount || 0).toLocaleString()} ETB</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminAllOrders;
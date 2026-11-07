// frontend/src/components/vendor/OrdersTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import API, { API_URL } from '../../services/api';

export default function OrdersTab({ currentStore, setActiveStoreTab }) {
  console.log('🔍 [DEBUG] OrdersTab rendered with currentStore prop:', currentStore);

  const [vendorTab, setVendorTab] = useState('requests');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [itemQuantitiesMap, setItemQuantitiesMap] = useState({});
  const [rejectedItemsMap, setRejectedItemsMap] = useState({});
  const [merchantNote, setMerchantNote] = useState('');
  const [notice, setNotice] = useState('');
  
  const prevPendingCountRef = useRef(0);

  // Helper function to format image and receipt URLs safely against API_URL
  const getFormattedUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanBase = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanPath}`;
  };

  // 1. Fetch store orders
  const fetchStoreOrders = async () => {
    if (!currentStore?.id) {
      console.log('⚠️ MERCHANT TAB -> currentStore.id is missing or undefined!');
      return;
    }
    console.log('🏪 MERCHANT FETCHING -> currentStore.id:', currentStore.id);
    
    setLoading(true);
    try {
      const response = await API.get(`/orders/vendor/${currentStore.id}`);
      console.log('📦 MERCHANT FETCH SUCCESS -> Response data:', response.data);
      
      if (response && response.data && response.data.success) {
        const fetchedOrders = response.data.orders || [];
        
        const newPending = fetchedOrders.filter((o) => o?.status === 'pending_merchant');
        if (newPending.length > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🛒 New Order Request!', {
              body: `You have received a new order request awaiting your review.`,
              icon: '/logo.png',
              badge: '/logo.png'
            });
          }
        }
        prevPendingCountRef.current = newPending.length;
        setOrders(fetchedOrders);
      }
    } catch (err) {
      console.error('Error fetching vendor orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Process Order Request (Accept/Reject)
  const handleProcessOrderRequest = async (orderId, action) => {
    if (action === 'accept') {
      let bankAccounts = currentStore?.bankAccounts;
      if (typeof bankAccounts === 'string') {
        try { bankAccounts = JSON.parse(bankAccounts); } catch (e) { bankAccounts = []; }
      }

      const validAccounts = Array.isArray(bankAccounts)
        ? bankAccounts.filter((acc) => acc?.accountNumber && String(acc.accountNumber).trim() !== '')
        : [];

      if (validAccounts.length === 0) {
        setNotice('⚠️ Bank account required! Please add at least one payout account before accepting orders.');
        localStorage.setItem('pendingOrderIdForAccept', orderId);
        if (typeof setActiveStoreTab === 'function') {
          setActiveStoreTab('bank-settings');
        }
        return; 
      }
    }

    try {
      const response = await API.put(`/orders/${orderId}/merchant-response`, {
        action,
        rejectionReason: merchantNote || (action === 'reject' ? 'Order rejected by merchant.' : 'Item unavailable or out of stock'),
        rejectedItemIds: Object.keys(rejectedItemsMap).filter((id) => rejectedItemsMap[id]),
        adjustedItems: itemQuantitiesMap,
      });

      if (response && response.data && (response.data.success === true || response.data.success === 'true')) {
        setNotice(`✓ Order ${action}ed successfully.`);
        setTimeout(() => setNotice(''), 3000);
        setSelectedOrder(null);
        setMerchantNote('');
        setRejectedItemsMap({});
        setItemQuantitiesMap({});

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Order #${orderId} ${action === 'accept' ? 'Accepted' : 'Rejected'}`, {
            body: `You successfully ${action}ed order #${orderId}.`,
            icon: '/logo.png'
          });
        }

        try {
          await fetchStoreOrders();
        } catch (fetchErr) {
          console.warn('Background order refresh error:', fetchErr);
        }
      } else {
        setNotice(response?.data?.message || 'Failed to process request.');
      }
    } catch (err) {
      console.error('Error processing request:', err);
      if (err.response?.data?.needsBankSetup) {
        localStorage.setItem('pendingOrderIdForAccept', orderId);
        if (typeof setActiveStoreTab === 'function') {
          setActiveStoreTab('bank-settings');
        }
      } else {
        setNotice(err.response?.data?.message || err.message || 'Failed to process request.');
      }
    }
  };

  // 3. Confirm Payment Receipt
  const handleVerifyPayment = async (orderId) => {
    try {
      const paymentResponse = await API.put(`/orders/${orderId}/verify-payment`, { 
        status: 'payment_verified' 
      });

      const data = paymentResponse?.data;

      if (data && (data.success === true || data.success === 'true')) {
        setNotice('✓ Payment verified! Order marked for dispatch.');
        setTimeout(() => setNotice(''), 3000);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Payment Verified & Dispatched', {
            body: `Payment for order #${orderId} has been verified successfully.`,
            icon: '/logo.png'
          });
        }

        try {
          await fetchStoreOrders();
        } catch (fetchErr) {
          console.warn('Background order refresh after verify:', fetchErr);
        }
      } else {
        setNotice(data?.message || 'Failed to verify payment.');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setNotice(err.response?.data?.message || err.message || 'Failed to verify payment.');
    }
  };

  useEffect(() => {
    fetchStoreOrders();
    const interval = setInterval(fetchStoreOrders, 10000);
    return () => clearInterval(interval);
  }, [currentStore?.id]);

  const safeOrders = Array.isArray(orders) ? orders : [];
  
  const active24hOrders = safeOrders.filter((ord) => {
    const activeStatuses = ['accepted', 'payment_uploaded', 'payment_verified', 'processing', 'dispatched'];
    return activeStatuses.includes(ord?.status);
  });

  const pendingRequests = safeOrders.filter((o) => o?.status === 'pending_merchant');
  const pendingPayments = safeOrders.filter((o) => o?.status === 'payment_uploaded');

  return (
    <div className="space-y-6">
      {notice && (
        <div className="bg-[#1E4D58] text-white p-4 rounded-2xl text-xs font-black shadow-md flex items-center justify-between">
          <span>{notice}</span>
        </div>
      )}

      {/* Vendor Dashboard Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setVendorTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
            vendorTab === 'requests'
              ? 'bg-[#1E4D58] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Incoming Requests ({pendingRequests.length})
        </button>
        <button
          onClick={() => setVendorTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
            vendorTab === 'payments'
              ? 'bg-[#1E4D58] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Verify Payments ({pendingPayments.length})
        </button>
        <button
          onClick={() => setVendorTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
            vendorTab === 'active'
              ? 'bg-[#1E4D58] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Active Orders ({active24hOrders.length})
        </button>
      </div>

      {loading && <div className="text-xs text-slate-400 font-bold">Refreshing orders...</div>}

      {/* 1. TAB: NEW ORDER REQUESTS */}
      {vendorTab === 'requests' && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase">
            Incoming Requests ({pendingRequests.length})
          </h3>
          {pendingRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs font-bold text-slate-400 uppercase">
              No pending order requests.
            </div>
          ) : (
            pendingRequests.map((req) => {
              let itemsList = [];
              try {
                if (typeof req.items === 'string') {
                  itemsList = JSON.parse(req.items);
                } else if (Array.isArray(req.items)) {
                  itemsList = req.items;
                }
              } catch (e) {
                itemsList = [];
              }

              const calculatedMerchantSubtotal = itemsList.reduce((sum, item) => {
                const isRejected = rejectedItemsMap[item.id];
                const qty = itemQuantitiesMap?.[item.id] !== undefined ? itemQuantitiesMap?.[item.id] : item.quantity;
                return sum + (isRejected ? 0 : Number(item.price) * Number(qty));
              }, 0);

              return (
                <div key={req.id} className="bg-white border-2 border-amber-300 rounded-3xl p-5 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-black text-slate-900">Order #{req.id}</span>
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Customer Phone: {req.deliveryAddress?.phoneNumber || req.phoneNumber || 'N/A'}
                      </span>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                      Requires Response
                    </span>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">
                      NEW ITEM REVIEW & QUANTITY ADJUSTMENT:
                    </span>
                    {itemsList.map((item) => {
                      const isRejected = rejectedItemsMap[item.id];
                      const currentQty = itemQuantitiesMap?.[item.id] !== undefined ? itemQuantitiesMap[item.id] : item.quantity;

                      return (
                        <div key={item.id} className={`p-3 rounded-2xl border transition text-xs space-y-2 ${isRejected ? 'bg-rose-50/50 border-rose-200 opacity-60' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{item.title}</span>
                            <span className="font-black text-[#1E4D58]">
                              {Number(item.price * (isRejected ? 0 : currentQty)).toLocaleString()} ETB
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 font-semibold">Ordered: x{item.quantity}</span>
                              {!isRejected && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-slate-700">Approve Qty:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max={item.quantity}
                                    defaultValue={currentQty}
                                    onBlur={(e) => {
                                      const val = Math.max(1, Math.min(item.quantity, Number(e.target.value)));
                                      setItemQuantitiesMap((prev) => ({ ...prev, [item.id]: val }));
                                    }}
                                    className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-xs"
                                  />
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setRejectedItemsMap((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${
                                isRejected
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {isRejected ? 'Item Rejected ✕' : 'Reject Item'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex justify-between items-center pt-3 border-t border-slate-200 font-bold text-xs">
                      <span className="text-slate-600 uppercase">Products Subtotal (Your Revenue):</span>
                      <span className="text-sm font-black text-[#1E4D58]">
                        {calculatedMerchantSubtotal.toLocaleString()} ETB
                      </span>
                    </div>
                  </div>

                  <textarea
                    placeholder="Optional note or reason for customer..."
                    value={merchantNote}
                    onChange={(e) => setMerchantNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    rows="2"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleProcessOrderRequest(req.id, 'reject')}
                      className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black uppercase cursor-pointer"
                    >
                      Reject Order
                    </button>
                    <button
                      onClick={() => handleProcessOrderRequest(req.id, 'accept')}
                      className="flex-1 py-2.5 bg-[#1E4D58] hover:bg-[#163C45] text-white rounded-xl text-xs font-black uppercase cursor-pointer shadow-md"
                    >
                      Accept Order
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. TAB: VERIFY PAYMENTS */}
      {vendorTab === 'payments' && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase">
            Pending Payment Receipts ({pendingPayments.length})
          </h3>
          {pendingPayments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs font-bold text-slate-400 uppercase">
              No pending payment receipts to verify.
            </div>
          ) : (
            pendingPayments.map((ord) => (
              <div key={ord.id} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900">Order #{ord.id}</span>
                  <div className="text-right">
                    <span className="text-xs font-black text-[#1E4D58] block">
                      Products Total: {Number(ord.subtotal || 0).toLocaleString()} ETB
                    </span>
                  </div>
                </div>
                {ord.paymentReceiptUrl && (
                  <div className="border border-slate-200 rounded-2xl p-2 bg-slate-50 text-center">
                    <a 
                      href={getFormattedUrl(ord.paymentReceiptUrl)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs font-bold text-blue-600 underline"
                    >
                      View Uploaded Bank Receipt
                    </a>
                  </div>
                )}
                <button
                  onClick={() => handleVerifyPayment(ord.id)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase cursor-pointer"
                >
                  Verify Payment & Dispatch
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. TAB: ACTIVE ORDERS */}
      {vendorTab === 'active' && (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase">
            Active Orders ({active24hOrders.length})
          </h3>
          {active24hOrders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs font-bold text-slate-400 uppercase">
              No active orders currently.
            </div>
          ) : (
            active24hOrders.map((ord) => (
              <div key={ord.id} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-900">Order #{ord.id}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-[10px] font-black rounded-full uppercase">
                    {ord.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex justify-between">
                  <span>Products Revenue: {Number(ord.subtotal || 0).toLocaleString()} ETB</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
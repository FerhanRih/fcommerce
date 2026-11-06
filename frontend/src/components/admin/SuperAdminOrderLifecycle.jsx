// frontend/src/components/admin/SuperAdminOrderLifecycle.jsx
import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, RefreshCw, CheckCircle2, XCircle, Clock, 
  CreditCard, ShieldCheck, ExternalLink, Copy, AlertTriangle, Eye 
} from 'lucide-react';
import API from '../../services/api';
 
const SuperAdminOrderLifecycle = () => {
  const [activeSubTab, setActiveSubTab] = useState('requests'); // 'requests' | 'decision' | 'paid' | 'verified'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); // Detail Modal
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Request Browser Notification Permission on Mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 2. Comprehensive Notification Helper for All Stages
  const checkAndNotifyStageOrders = (stage, ordersList) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const count = ordersList.length;
    if (count === 0) return;

    const lastCountKey = `admin_notified_count_${stage}`;
    const lastNotified = sessionStorage.getItem(lastCountKey) || 0;

    if (count > Number(lastNotified)) {
      let title = '🚨 FCOMMERCE Super Admin Alert';
      let body = `You have ${count} item(s) in your queue.`;

      if (stage === 'requests') {
        title = '🚨 New Order Request!';
        body = `There are ${count} new order request(s) waiting for merchant decision.`;
      } else if (stage === 'decision') {
        title = '📦 Merchant Decisions Made';
        body = `${count} order(s) have been processed by merchants and await buyer payment.`;
      } else if (stage === 'paid') {
        title = '💳 Payment Receipts Uploaded!';
        body = `${count} customer(s) uploaded transfer receipts awaiting merchant verification.`;
      } else if (stage === 'verified') {
        title = '🛡️ Verified Queue Ready';
        body = `${count} order(s) have verified payments and are ready for dispatch.`;
      }

      new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png'
      });

      sessionStorage.setItem(lastCountKey, count);
    }
  };

  // 3. Unified Fetch Orders (Supports Silent Background Polling)
  const fetchOrders = async (stage, isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
     
      const response = await API.get(`/admin/lifecycle-orders?stage=${stage}`);
      const data = response.data;
      if (data.success) {
        const fetchedOrders = data.orders || [];
        setOrders(fetchedOrders);
        checkAndNotifyStageOrders(stage, fetchedOrders);
      }
    } catch (error) {
      console.error('Fetch Orders Error:', error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // 4. Tab Change & Auto-Refresh Polling (Every 15s)
  useEffect(() => {
    fetchOrders(activeSubTab);

    const pollInterval = setInterval(() => {
      fetchOrders(activeSubTab, true); // true = silent fetch, keeps user UI steady
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [activeSubTab]);

  // 5. Dual-Mode SMS Trigger Function
  const handleSendSMS = (rawPhone, message) => {
    if (!rawPhone) {
      showToast('No phone number associated with this record.');
      return;
    }
    const cleanPhone = rawPhone.startsWith('+') ? rawPhone : `+251${rawPhone.replace(/^0/, '')}`;
    const encodedMsg = encodeURIComponent(message);
    const smsUri = `sms:${cleanPhone}?body=${encodedMsg}`;

    // Launch Native SMS App
    window.location.href = smsUri;

    // Clipboard Fallback
    navigator.clipboard.writeText(message).then(() => {
      showToast(`SMS Link Triggered & Message Copied to Clipboard for ${cleanPhone}!`);
    }).catch(() => {
      showToast(`SMS Link Opened for ${cleanPhone}`);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* TOAST FLOATING ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E4D58] text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-black flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER TITLE */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Order Lifecycle Dispatch Hub</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Monitor real-time order requests, merchant decisions, payments, and dispatch SMS alerts.
          </p>
        </div>
        <button
          onClick={() => fetchOrders(activeSubTab)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stage</span>
        </button>
      </div>

      {/* RESPONSIVE 4 SUB-TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-2 lg:grid-cols-4 gap-1.5">
        <button
          onClick={() => setActiveSubTab('requests')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'requests' ? 'bg-[#1E4D58] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">1. Requests</span>
        </button>

        <button
          onClick={() => setActiveSubTab('decision')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'decision' ? 'bg-[#1E4D58] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">2. Decisions</span>
        </button>

        <button
          onClick={() => setActiveSubTab('paid')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'paid' ? 'bg-[#1E4D58] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">3. Paid Orders</span>
        </button>

        <button
          onClick={() => setActiveSubTab('verified')}
          className={`py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer ${
            activeSubTab === 'verified' ? 'bg-[#1E4D58] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">4. Verified Queue</span>
        </button>
      </div>

      {/* ORDERS LIST CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#1E4D58]" />
            <span>Fetching stage records from database...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">No active records in this stage</p>
            <p className="text-[11px] text-slate-400">New orders will automatically appear here as buyers and merchants interact.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const merchantPhone = order.Store?.user?.phone || order.Store?.phone || order.merchantPhone || '';
              const customerPhone = order.User?.phone || order.customerPhone || '';
              const storeName = order.Store?.store_name || order.Store?.name || 'Store';
              const customerName = order.User?.name || 'Customer';

              const orderSubtotal = Number(order.subtotal || 0);
              const deliveryFee = Number(order.deliveryFee || 0);

              return (
                <div key={order.id} className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-slate-300 transition space-y-4 bg-slate-50/50">
                  
                  {/* CARD HEADER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-black text-[#1E4D58] text-sm">Order #{order.id}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">
                        Products Total: {orderSubtotal.toLocaleString()} <span className="text-[10px]">ETB</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        (Delivery Fee: {deliveryFee.toLocaleString()} ETB paid in cash)
                      </div>
                    </div>
                  </div>

                  {/* DETAILS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Store / Merchant</span>
                      <p className="font-extrabold text-slate-900">{storeName}</p>
                      <p className="text-slate-500 font-mono mt-0.5">{merchantPhone || 'No phone recorded'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Customer / Buyer</span>
                      <p className="font-extrabold text-slate-900">{customerName}</p>
                      <p className="text-slate-500 font-mono mt-0.5">{customerPhone || 'No phone recorded'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Date & Time</span>
                      <p className="font-bold text-slate-700">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* STAGE-SPECIFIC SMS ACTION BUTTONS */}
                  <div className="pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-black text-xs rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Order Items</span>
                    </button>

                    {/* SUB-TAB 1: REQUEST SMS (Merchant gets only products amount) */}
                    {activeSubTab === 'requests' && (
                      <button
                        onClick={() => handleSendSMS(
                          merchantPhone,
                          `[FCOMMERCE] New order #${order.id} received for ${storeName}. Products Subtotal: ${orderSubtotal.toLocaleString()} ETB. Please review and accept: https://fcommerce.et/orders/${order.id}`
                        )}
                        className="w-full sm:w-auto px-4 py-2 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Send Order Alert SMS to Merchant</span>
                      </button>
                    )}

                    {/* SUB-TAB 2: DECISION SMS (User gets products amount + cash delivery reminder) */}
                    {activeSubTab === 'decision' && (
                      <button
                        onClick={() => handleSendSMS(
                          customerPhone,
                          `[FCOMMERCE] Great news ${customerName}! Your order #${order.id} from ${storeName} is accepted. Products Amount: ${orderSubtotal.toLocaleString()} ETB (Delivery fee of ${deliveryFee.toLocaleString()} ETB is paid in cash upon delivery). Please complete payment: https://fcommerce.et`
                        )}
                        className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Send Acceptance & Payment SMS to Buyer</span>
                      </button>
                    )}

                    {/* SUB-TAB 3: PAID SMS (Merchant gets products amount verification notice) */}
                    {activeSubTab === 'paid' && (
                      <button
                        onClick={() => handleSendSMS(
                          merchantPhone,
                          `[FCOMMERCE] Payment uploaded for order #${order.id} (Products Amount: ${orderSubtotal.toLocaleString()} ETB). Merchant, please verify receipt: https://fcommerce.et`
                        )}
                        className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Send Verify Payment SMS to Merchant</span>
                      </button>
                    )}

                    {/* SUB-TAB 4: VERIFIED SMS (Buyer dispatch notice + cash delivery reminder) */}
                    {activeSubTab === 'verified' && (
                      <button
                        onClick={() => handleSendSMS(
                          customerPhone,
                          `[FCOMMERCE] Payment for order #${order.id} is verified! Your items are in transit. Delivery fee (${deliveryFee.toLocaleString()} ETB) is payable in cash upon arrival.`
                        )}
                        className="w-full sm:w-auto px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Send Dispatch SMS to Buyer</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">Order Items Breakdown (#{selectedOrder.id})</h3>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* PRODUCTS LIST MAPPING */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {(() => {
                let parsedItems = [];
                const rawItems = selectedOrder?.items || selectedOrder?.orderItems || [];
                
                try {
                  parsedItems = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems;
                } catch (e) {
                  console.error("Error parsing order items JSON:", e);
                  parsedItems = [];
                }

                return Array.isArray(parsedItems) && parsedItems.length > 0 ? (
                  parsedItems.map((item, idx) => {
                    const itemName = item.name || item.title || item.productName || item.product_name || 'Product Item';
                    const itemQty = Number(item.approvedQuantity !== undefined ? item.approvedQuantity : (item.quantity || item.qty || 1));
                    const itemPrice = Number(item.price || item.unitPrice || item.unit_price || 0);
                    const isItemRejected = item.status === 'rejected' || itemQty === 0;

                    return (
                      <div key={idx} className={`flex justify-between items-center py-2 border-b border-slate-100 text-xs ${isItemRejected ? 'opacity-50 line-through' : ''}`}>
                        <div>
                          <p className="font-extrabold text-slate-800">
                            {itemName} {isItemRejected && <span className="text-rose-600 no-underline text-[10px]">(Rejected)</span>}
                          </p>
                          <p className="text-slate-400">
                            Qty: {itemQty} × {itemPrice.toLocaleString()} ETB
                          </p>
                        </div>
                        <span className="font-black text-slate-900">
                          {(isItemRejected ? 0 : itemPrice * itemQty).toLocaleString()} ETB
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    No item details recorded for this order.
                  </p>
                );
              })()}
            </div>

            {/* TOTALS SUMMARY */}
            <div className="border-t pt-3 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Products Subtotal:</span>
                <span>{Number(selectedOrder.subtotal || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee (Cash on Delivery):</span>
                <span>{Number(selectedOrder.deliveryFee || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between font-black text-sm text-[#1E4D58] pt-1 border-t">
                <span>Grand Total:</span>
                <span>{Number(selectedOrder.totalAmount || 0).toLocaleString()} ETB</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition"
            >
              Close Modal
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminOrderLifecycle;
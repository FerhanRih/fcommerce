import React, { useState, useEffect, useRef } from 'react';
import API, { API_URL } from '../services/api';
import { showAppNotification } from '../utils/notificationHelper';

export default function TrackOrderPage({ currentUser, onBackToMarketplace }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptFiles, setReceiptFiles] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const [notices, setNotices] = useState({});

  // Keep track of previous order statuses to trigger notifications when they change
  const prevStatusesRef = useRef({});

  const fetchUserOrders = async () => {
    if (!currentUser?.phone) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await API.get(`/orders/user/${currentUser.phone}`);
      if (response && response.data && response.data.success) {
        const fetchedOrders = response.data.orders || [];

        // Check for status updates and trigger browser notifications
        fetchedOrders.forEach((ord) => {
          const prevStatus = prevStatusesRef.current[ord.id];
          if (prevStatus && prevStatus !== ord.status) {
            if ('Notification' in window && Notification.permission === 'granted') {
              let title = 'Order Status Updated!';
              let body = `Your order #${ord.id} status is now: ${ord.status.replace('_', ' ')}`;

              if (ord.status === 'accepted') {
                title = '🛒 Order Accepted by Merchant!';
                body = `Order #${ord.id} has been accepted. You can now view bank details and upload your payment receipt for items.`;
              } else if (ord.status === 'payment_verified') {
                title = '✅ Payment Verified!';
                body = `Payment for order #${ord.id} was verified. Ready for store pickup.`;
              } else if (ord.status === 'dispatched') {
                title = '🚚 Driver In Transit!';
                body = `Your courier is on the way with order #${ord.id}. Check your PIN!`;
              } else if (ord.status === 'delivered') {
                title = '🎉 Order Delivered!';
                body = `Order #${ord.id} has been marked as delivered. Thank you!`;
              } else if (ord.status === 'rejected') {
                title = '❌ Order Declined';
                body = `Order #${ord.id} was declined by the merchant.`;
              }

              showAppNotification(title, body);
            }
          }
          prevStatusesRef.current[ord.id] = ord.status;
        });

        setOrders(fetchedOrders);
      }
    } catch (err) {
      console.error('Error fetching user tracking orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOrders();
    const interval = setInterval(fetchUserOrders, 5000);
    return () => clearInterval(interval);
  }, [currentUser?.phone]);

  const handleUploadReceipt = async (orderId) => {
    const file = receiptFiles[orderId];
    if (!file) {
      setNotices((prev) => ({ ...prev, [orderId]: 'Please select a payment receipt image first.' }));
      return;
    }

    setUploadingId(orderId);
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const response = await API.put(`/orders/${orderId}/upload-receipt`, formData);
      
     if (response && response.data && (response.data.success === true || response.data.success === 'true')) {
  setNotices((prev) => ({ ...prev, [orderId]: '✓ Payment receipt uploaded successfully!' }));

  // 👇 Clean, universal notification call
  showAppNotification(
    'Receipt Uploaded',
    `Your receipt for order #${orderId} was uploaded successfully.`
  );

  try {
    await fetchUserOrders();
  } catch (fetchErr) {
    console.warn('Background order refresh after upload:', fetchErr);
  }
} else {
        const errorMsg = response?.data?.message || 'Failed to upload receipt.';
        setNotices((prev) => ({ ...prev, [orderId]: errorMsg }));
      }
    } catch (err) {
      console.error('Upload catch error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to upload receipt.';
      setNotices((prev) => ({ ...prev, [orderId]: errorMsg }));
    } finally {
      setUploadingId(null);
    }
  };
  
  const parseBankAccounts = (store) => {
    let raw = store?.bankAccounts;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch (e) { raw = []; }
    }
    return Array.isArray(raw) ? raw : [];
  };

  const parseItems = (items) => {
    let raw = items;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch (e) { raw = []; }
    }
    return Array.isArray(raw) ? raw : [raw].filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={onBackToMarketplace} className="text-xs font-bold text-slate-700 hover:text-[#1E4D58] transition cursor-pointer">
            ← Back to Marketplace
          </button>
          <span className="text-xs font-black text-[#1E4D58] uppercase">Active Order Tracking</span>
        </div>

        <h1 className="text-xl font-black text-slate-900">Your Live Orders ({orders.length})</h1>

        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white rounded-3xl border">Loading your orders...</div>
        ) : (
          orders.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-500">No active orders currently tracked under {currentUser?.phone}.</p>
            </div>
          ) : (
            orders.map((ord) => {
              const bankAccounts = parseBankAccounts(ord.store);
              const items = parseItems(ord.items);
              const notice = notices[ord.id];

              const receiptImageUrl = ord.paymentReceiptUrl 
                ? (ord.paymentReceiptUrl.startsWith('http') ? ord.paymentReceiptUrl : `${API_URL}${ord.paymentReceiptUrl}`)
                : null;

              return (
                <div key={ord.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Order #{ord.id}</span>
                      <h3 className="text-sm font-black text-slate-900">{ord.store?.storeName || 'Partner Store'}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      ord.status === 'pending_merchant' ? 'bg-amber-50 text-amber-800' :
                      ord.status === 'accepted' ? 'bg-emerald-50 text-emerald-800' :
                      ord.status === 'payment_uploaded' ? 'bg-blue-50 text-blue-800' :
                      ord.status === 'payment_verified' ? 'bg-purple-50 text-purple-800' :
                      ord.status === 'rejected' ? 'bg-rose-50 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      Status: {ord.status.replace('_', ' ')}
                    </span>
                  </div>

                  {notice && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold">
                      {notice}
                    </div>
                  )}

                  {/* Status Banners */}
                  {ord.status === 'pending_merchant' && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1">
                      <span className="text-xs font-black text-amber-900 block">Waiting for Merchant Acceptance</span>
                      <p className="text-[11px] text-amber-700">The store is reviewing your order. Bank details will appear once accepted.</p>
                    </div>
                  )}

                  {ord.status === 'rejected' && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                      <span className="text-xs font-black text-rose-900 block">Order Declined</span>
                      <p className="text-[11px] text-rose-700">Reason: "{ord.rejectionReason || 'Item unavailable'}"</p>
                    </div>
                  )}

                  {(ord.status === 'accepted' || ord.status === 'payment_uploaded' || ord.status === 'payment_verified') && (
                    <div className="space-y-4 pt-2">
                      {/* Price Breakdown showing Subtotal vs Delivery Payable After Delivery */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                        <div className="flex justify-between font-bold">
                          <span>Items Subtotal (Transfer Now):</span>
                          <span className="text-[#1E4D58] font-black">{Number(ord.subtotal).toLocaleString()} ETB</span>
                        </div>
                        <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-2">
                          <span className="font-semibold">🚚 Delivery Fee (Pay cash on arrival):</span>
                          <span className="font-extrabold text-amber-800">{Number(ord.deliveryFee || 200).toLocaleString()} ETB</span>
                        </div>
                      </div>

                      {/* Bank Accounts */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Merchant Bank Accounts for Transfer (Items Only):</span>
                        {bankAccounts.length === 0 ? (
                          <p className="text-xs text-amber-700 font-bold">Merchant is setting up accounts...</p>
                        ) : (
                          bankAccounts.map((b, i) => (
                            <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between text-xs">
                              <div>
                                <span className="font-extrabold text-slate-900 block">{b.bankName}</span>
                                <span className="text-slate-500">Acc: {b.accountNumber}</span>
                              </div>
                              <span className="text-[10px] font-bold text-[#1E4D58] bg-white px-2 py-0.5 rounded-xl border">
                                {b.accountHolder}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Uploaded Receipt Preview */}
                      {receiptImageUrl && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase block">Uploaded Payment Receipt:</span>
                          <a href={receiptImageUrl} target="_blank" rel="noopener noreferrer">
                            <img
                              src={receiptImageUrl}
                              alt="Payment Receipt"
                              className="w-full h-36 object-cover rounded-xl border border-slate-200 hover:opacity-95 transition cursor-zoom-in"
                            />
                          </a>
                          <span className="text-[10px] text-slate-400 block text-center">Click image to view full size</span>
                        </div>
                      )}

                      {ord.status === 'payment_uploaded' ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-900 text-center">
                          ✓ Payment Receipt Uploaded. Waiting for merchant verification & dispatch.
                        </div>
                      ) : ord.status === 'accepted' ? (
                        <div className="space-y-2 pt-2 border-t">
                          <label className="text-[10px] font-black text-slate-700 uppercase block">Upload Transfer Receipt Screenshot (Items Total)</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setReceiptFiles({ ...receiptFiles, [ord.id]: e.target.files[0] })}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#1E4D58] file:text-white cursor-pointer"
                          />
                          <button
                            onClick={() => handleUploadReceipt(ord.id)}
                            disabled={uploadingId === ord.id}
                            className="w-full py-3 bg-[#1E4D58] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#163C45] cursor-pointer"
                          >
                            {uploadingId === ord.id ? 'Uploading...' : 'Confirm & Send Receipt'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* 1. Pickup Ready Status */}
                  {(ord.status === 'payment_verified' || ord.status === 'verified') && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1">
                      <span className="text-xs font-black text-amber-900 block">📦 Payment Verified — Ready for Store Pickup</span>
                      <p className="text-[11px] text-amber-700">The merchant is preparing your package for the courier.</p>
                    </div>
                  )}

                  {/* 2. In Transit Status */}
                  {ord.status === 'dispatched' && (
                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-center space-y-1 animate-pulse">
                      <span className="text-xs font-black text-sky-900 block">🚚 Driver is In Transit!</span>
                      <p className="text-[11px] text-sky-700">Your courier is on the way. Have your delivery fee cash ({Number(ord.deliveryFee || 200).toLocaleString()} ETB) ready for arrival.</p>
                    </div>
                  )}

                  {/* 3. Secure Delivery PIN */}
                  {ord.deliveryPin && ord.status !== 'delivered' && (
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-emerald-900 text-xs uppercase">Secure Delivery PIN</h4>
                        <p className="text-[11px] text-emerald-700">Give this 4-digit PIN to the driver upon delivery completion.</p>
                      </div>
                      <span className="font-mono font-black text-lg bg-emerald-600 text-white px-3 py-1.5 rounded-xl shadow-xs">
                        {ord.deliveryPin}
                      </span>
                    </div>
                  )}

                  {/* 4. Delivered Status */}
                  {ord.status === 'delivered' && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                      <span className="text-xs font-black text-emerald-900 block">🎉 Order Delivered Successfully</span>
                      <p className="text-[11px] text-emerald-700">Thank you for doing business with FCOMMERCE!</p>
                    </div>
                  )}

                  {/* Items Breakdown */}
                  <div className="pt-2 border-t space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Items Breakdown:</span>
                    {items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-700">
                        <span>{it.name || it.title || 'Product Item'} (Qty: {it.approvedQuantity !== undefined ? it.approvedQuantity : it.quantity || 1})</span>
                        <span className="font-bold">{Number((it.price || 0) * (it.approvedQuantity || it.quantity || 1)).toLocaleString()} ETB</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
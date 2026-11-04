// frontend/src/components/admin/SuperAdminDeliveryHub.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, PhoneCall, MapPin, Store, User, RefreshCw, 
  CheckCircle2, Navigation, Lock, ShieldCheck, Package, Settings 
} from 'lucide-react';
import SuperAdminDeliveryPricing from './SuperAdminDeliveryPricing';
import API from '../../services/api';

const SuperAdminDeliveryHub = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'verified' | 'dispatched'
  const [toastMessage, setToastMessage] = useState(null);

  // Modal States
  const [selectedOrderForPin, setSelectedOrderForPin] = useState(null);
  const [selectedOrderForItems, setSelectedOrderForItems] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [inputPin, setInputPin] = useState('');

  // Keep track of previous order count for notification triggers
  const prevCountRef = useRef(0);

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

  // 2. Notification Helper for New Deliveries
  const checkAndNotifyDeliveries = (ordersList) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const count = ordersList.length;
    if (count > prevCountRef.current && prevCountRef.current !== 0) {
      new Notification('🚚 FCOMMERCE Delivery Queue Update', {
        body: `You have ${count} active delivery order(s) requiring attention.`,
        icon: '/logo.png',
        badge: '/logo.png'
      });
    }
    prevCountRef.current = count;
  };

  const fetchDeliveryOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
const response = await API.get(`/admin/delivery-orders?deliveryStatus=${filter}`);
const data = response.data;
      if (data.success) {
        const fetchedOrders = data.orders || [];
        setOrders(fetchedOrders);
        checkAndNotifyDeliveries(fetchedOrders);
      }
    } catch (error) {
      console.error('Fetch Delivery Orders Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryOrders();
    const intervalId = setInterval(() => {
      fetchDeliveryOrders();
    }, 15000);
    return () => clearInterval(intervalId);
  }, [filter]);

  const updateStatus = async (orderId, newStatus, pin = null) => {
    try {
      const token = localStorage.getItem('token');
    const response = await API.put(`/admin/delivery-orders/${orderId}/status`, {
  status: newStatus,
  pin
});
const data = response.data;
      if (data.success) {
        showToast(`Order #${orderId} marked as ${newStatus.toUpperCase()}!`);
        
        // Notify Super Admin on successful status transition
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Order #${orderId} ${newStatus === 'dispatched' ? 'In Transit 🚚' : 'Delivered 🎉'}`, {
            body: `Order #${orderId} was successfully updated to ${newStatus}.`,
            icon: '/logo.png'
          });
        }

        setSelectedOrderForPin(null);
        setInputPin('');
        fetchDeliveryOrders();
      } else {
        alert(data.message || 'Failed to update status.');
      }
    } catch (error) {
      console.error('Update Delivery Error:', error);
      alert('Network error while updating delivery status.');
    }
  };

  const handleSendSMS = (phone, rawMessage) => {
    if (!phone || phone === 'N/A') {
      showToast('Phone number unavailable.');
      return;
    }
    const cleanPhone = phone.startsWith('+') ? phone : `+251${phone.replace(/^0/, '')}`;
    const smsUri = `sms:${cleanPhone}?body=${encodeURIComponent(rawMessage)}`;

    window.location.href = smsUri;
    navigator.clipboard.writeText(rawMessage).then(() => {
      showToast(`SMS Link Launched & Copied for ${cleanPhone}!`);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E4D58] text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-black flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DELIVERY PRICE LIST MODAL */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-2 relative shadow-2xl border border-slate-200 my-8">
            <SuperAdminDeliveryPricing onBack={() => setShowPricingModal(false)} />
          </div>
        </div>
      )}

      {/* PIN VERIFICATION MODAL */}
      {selectedOrderForPin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-3 text-[#1E4D58]">
              <div className="p-3 bg-[#1E4D58]/10 rounded-2xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Enter Delivery PIN</h3>
                <p className="text-xs text-slate-500">Order #{selectedOrderForPin.id} Fulfilment Verification</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Ask the buyer for their 4-digit security PIN provided on their tracking screen.
            </p>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">4-Digit PIN</label>
              <input 
                type="text" 
                maxLength="4"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="e.g. 4829"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-black text-center text-lg tracking-widest focus:outline-none focus:border-[#1E4D58]"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => { setSelectedOrderForPin(null); setInputPin(''); }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus(selectedOrderForPin.id, 'delivered', inputPin)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Complete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEMS MANIFEST MODAL */}
      {selectedOrderForItems && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-[#1E4D58]" />
                <div>
                  <h3 className="font-black text-slate-900 text-base">Order Item Manifest</h3>
                  <p className="text-xs text-slate-500">Order #{selectedOrderForItems.id} Contents</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrderForItems(null)}
                className="text-slate-400 hover:text-slate-700 font-black text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {(typeof selectedOrderForItems.items === 'string' 
                ? JSON.parse(selectedOrderForItems.items) 
                : (selectedOrderForItems.items || [])).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-black text-slate-900 break-words">{item.title || item.name || 'Product Item'}</p>
                    <p className="text-[11px] text-slate-500">Qty: {item.quantity || item.qty || 1} × ETB {Number(item.price || 0).toLocaleString()}</p>
                  </div>
                  <span className="font-black text-[#1E4D58] shrink-0">
                    ETB {((item.quantity || item.qty || 1) * Number(item.price || 0)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Items Subtotal:</span>
                <span>ETB {Number(selectedOrderForItems.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 font-extrabold">
                <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Delivery Fee:</span>
                <span>ETB {Number(selectedOrderForItems.deliveryFee || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-900 font-black text-sm pt-2 border-t border-slate-100">
                <span>Total Amount:</span>
                <span className="text-[#1E4D58]">ETB {Number(selectedOrderForItems.totalAmount || selectedOrderForItems.amount || 0).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrderForItems(null)}
              className="w-full py-3 bg-[#1E4D58] hover:bg-[#15353d] text-white font-black text-xs rounded-xl transition cursor-pointer"
            >
              Close Manifest
            </button>
          </div>
        </div>
      )}

      {/* HEADER BAR WITH PRICE LIST BUTTON */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Active Delivery Dispatch Hub</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage active pickups and transit orders. Delivered items are archived in Master Orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPricingModal(true)}
            className="px-4 py-2.5 bg-[#1E4D58]/10 hover:bg-[#1E4D58]/20 text-[#1E4D58] font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Edit Delivery Price List</span>
          </button>

          <button
            onClick={fetchDeliveryOrders}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs space-x-1">
        {[
          { id: 'all', label: 'All Active' },
          { id: 'verified', label: '1. Pickup Ready' },
          { id: 'dispatched', label: '2. In Transit' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 py-2 px-3 text-xs font-black rounded-xl transition cursor-pointer text-center ${
              filter === tab.id ? 'bg-[#1E4D58] text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DELIVERY ORDERS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#1E4D58]" />
            <span>Loading active delivery manifest...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <Truck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">No active deliveries in this queue</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const merchant = order.Store || {};
              const customer = order.User || {};
              const itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
              
              const merchantPhone = merchant.phone || merchant.phoneNumber || merchant.ownerPhone || 'N/A';
              const customerPhone = customer.phone || order.customerPhone || 'N/A';
              const isPickupReady = ['payment_verified', 'verified', 'payment_approved', 'paid'].includes(order.status);

              return (
                <div key={order.id} className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-slate-300 transition space-y-4 bg-slate-50/50 min-w-0">
                  
                  {/* CARD TOP ROW */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                      <span className="font-black text-[#1E4D58] text-sm">Order #{order.id}</span>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isPickupReady ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {isPickupReady ? 'Ready for Pickup' : order.status}
                      </span>
                      {order.deliveryPin && (
                        <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                          PIN: {order.deliveryPin}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-black text-slate-900 flex items-center justify-between sm:justify-end gap-3">
                      <span>Total Payload: {Number(order.totalAmount || order.amount || 0).toLocaleString()} ETB</span>
                      <button
                        onClick={() => setSelectedOrderForItems(order)}
                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-[10px] rounded-lg transition cursor-pointer shrink-0"
                      >
                        View Manifest ({itemsList.length})
                      </button>
                    </div>
                  </div>

                  {/* MERCHANT vs CUSTOMER DUAL COLUMNS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    
                    {/* MERCHANT PICKUP LOCATION */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 min-w-0">
                      <div className="flex items-center space-x-2 text-[#1E4D58]">
                        <Store className="w-4 h-4 shrink-0" />
                        <span className="font-black uppercase text-[10px] tracking-wider">1. Pickup Origin (Merchant)</span>
                      </div>
                      <p className="font-extrabold text-slate-900 break-words">{merchant.store_name || merchant.name || 'Store Name'}</p>
                      <div className="text-slate-700 break-words flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="break-words"><strong>Address:</strong> {merchant.address || merchant.landmark || 'Address not specified'}</span>
                      </div>
                      <p className="text-slate-800 font-mono font-bold">Phone: {merchantPhone}</p>

                      <button
                        onClick={() => handleSendSMS(
                          merchantPhone,
                          `[FCOMMERCE DISPATCH] Courier is en route to "${merchant.store_name || 'Store'}" for Order #${order.id} pickup.`
                        )}
                        className="mt-2 w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <PhoneCall className="w-3 h-3 shrink-0" />
                        <span>SMS Pickup Alert to Merchant</span>
                      </button>
                    </div>

                    {/* CUSTOMER DROP-OFF LOCATION */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 min-w-0">
                      <div className="flex items-center space-x-2 text-emerald-700">
                        <User className="w-4 h-4 shrink-0" />
                        <span className="font-black uppercase text-[10px] tracking-wider">2. Drop-Off Destination (Buyer)</span>
                      </div>
                      <p className="font-extrabold text-slate-900 break-words">{customer.name || 'Customer Name'}</p>
                      <div className="text-slate-700 break-words flex items-start gap-1">
                        <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="break-all break-words"><strong>Delivery Address:</strong> {order.deliveryAddress || customer.address || 'Address not specified'}</span>
                      </div>
                      <p className="text-slate-800 font-mono font-bold">Phone: {customerPhone}</p>

                      <button
                        onClick={() => handleSendSMS(
                          customerPhone,
                          `[FCOMMERCE DISPATCH] Driver is en route with your Order #${order.id}! Your Secure Delivery PIN is: ${order.deliveryPin || 'XXXX'}`
                        )}
                        className="mt-2 w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <PhoneCall className="w-3 h-3 text-emerald-700 shrink-0" />
                        <span>SMS Delivery Alert & PIN to Customer</span>
                      </button>
                    </div>

                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold">
                      Created: {new Date(order.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex space-x-2">
                      {isPickupReady && (
                        <button
                          onClick={() => updateStatus(order.id, 'dispatched')}
                          className="px-4 py-2 bg-[#1E4D58] hover:bg-[#163C45] text-white font-black text-xs rounded-xl cursor-pointer shadow-xs flex items-center space-x-1"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Mark as "In Transit"</span>
                        </button>
                      )}

                      {order.status === 'dispatched' && (
                        <button
                          onClick={() => setSelectedOrderForPin(order)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer flex items-center space-x-1.5 shadow-xs animate-pulse"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Mark as "Delivered" (PIN Required)</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default SuperAdminDeliveryHub;
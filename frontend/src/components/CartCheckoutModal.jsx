// frontend/src/components/CartCheckoutModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API from '../services/api';

// Official Addis Ababa Subcities with default dynamic delivery fees (Admin configurable)
const ADDIS_SUBCITIES = [
  { name: 'Bole', defaultFee: 150 },
  { name: 'Kazanchis / Arada', defaultFee: 150 },
  { name: 'Kirkos', defaultFee: 150 },
  { name: 'Yeka', defaultFee: 180 },
  { name: 'Lideta', defaultFee: 180 },
  { name: 'Gulele', defaultFee: 200 },
  { name: 'Nifas Silk-Lafto', defaultFee: 220 },
  { name: 'Kolfe Keranio', defaultFee: 250 },
  { name: 'Akaky Kaliti', defaultFee: 300 },
  { name: 'Lemi Kura / Bole Bulbula', defaultFee: 220 },
  { name: 'Other Central Addis Ababa Area', defaultFee: 200 },
];


export default function CartCheckoutModal({
  isOpen,
  onClose,
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onOrderSubmitted,
  currentUser,
}) {
  // Item selection state (map of item.id -> boolean)
  const [selectedItemIds, setSelectedItemIds] = useState({});

  // Address State (Loaded from LocalStorage)
  const [address, setAddress] = useState({
    subcity: 'Bole',
    woreda: '',
    specificArea: '',
    phoneNumber: '',
    notes: '',
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);

  // Delivery & Admin Pricing State
  const [deliveryFee, setDeliveryFee] = useState(150);
  const [subcityFees, setSubcityFees] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [platformOpen, setPlatformOpen] = useState(true);
  const getAddressStorageKey = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id || user?.phone;
    return userId ? `user_delivery_address_${userId}` : null;
  };
// Inside CartCheckoutModal.jsx (Make sure currentUser is passed as a prop to this component)
useEffect(() => {
  const initialSelection = {};
  cartItems.forEach((item) => {
    initialSelection[item.id] = true;
  });
  setSelectedItemIds(initialSelection);

  // 1. Load admin-configured subcity rates
  const fetchDeliveryRates = async () => {
try {
  const response = await API.get('/settings/delivery-fees');
  const data = response.data;
  if (data && data.fees) {
    setSubcityFees(data.fees);
    return;
  }
} catch (err) {
  console.error('Error fetching delivery fees:', err);
}

    const defaultMap = {};
    ADDIS_SUBCITIES.forEach((s) => {
      defaultMap[s.name] = s.defaultFee;
    });
    setSubcityFees(defaultMap);
  };

  fetchDeliveryRates();

  // 2. Load user-specific saved delivery address
  const key = getAddressStorageKey();
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (key) {
    const savedAddr = localStorage.getItem(key);
    if (savedAddr) {
      try {
        const parsed = JSON.parse(savedAddr);
        setAddress(parsed);
        setHasSavedAddress(true);
        setIsEditingAddress(false);
      } catch (err) {
        console.error('Error loading saved address:', err);
      }
    } else {
      // New user or no saved address: Default empty with prefilled phone if available
      setAddress({
        subcity: 'Bole',
        woreda: '',
        specificArea: '',
        phoneNumber: storedUser?.phone || '',
        notes: '',
      });
      setHasSavedAddress(false);
      setIsEditingAddress(true);
    }
  } else {
    setIsEditingAddress(true);
    setHasSavedAddress(false);
  }
}, [cartItems, currentUser]); 

  useEffect(() => {
  API.get('/settings/platform-status')
  .then(res => {
    const data = res.data;
    if (data.success && data.storefrontOpen === false) {
      setPlatformOpen(false);
    }
  })
  .catch(err => {
    console.error('Error fetching platform status:', err);
  });
}, []);
// update delivery fee
  useEffect(() => {
    if (address.subcity) {
      const fee = subcityFees[address.subcity] ?? ADDIS_SUBCITIES.find(s => s.name === address.subcity)?.defaultFee ?? 200;
      setDeliveryFee(Number(fee));
    }
  }, [address.subcity, subcityFees]);

  if (!isOpen) return null;

  // Toggle item selection checkbox
  const toggleSelectItem = (id) => {
    setSelectedItemIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter items that are currently ticked
  const activeItems = cartItems.filter((item) => selectedItemIds[item.id]);

  // Price calculations
  const calculateSubtotal = () => {
    return activeItems.reduce((sum, item) => {
      const qty = item.selectedQuantity || item.quantity || item.minOrderQty || 1;
      return sum + Number(item.price || 0) * qty;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const grandTotal = subtotal + (activeItems.length > 0 ? deliveryFee : 0);

  // Handle quantity adjustment with MOQ enforcement
  const handleQtyChange = (item, delta) => {
    const currentQty = item.selectedQuantity || item.quantity || item.minOrderQty || 1;
    const minQty = item.minOrderQty || 1;
    const newQty = currentQty + delta;

    if (newQty < minQty) {
      alert(`Minimum order limit for "${item.title}" is ${minQty} units.`);
      return;
    }

    if (onUpdateQuantity) {
      onUpdateQuantity(item.id, newQty);
    }
  };

 // Save address securely to user-specific storage key
  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!address.subcity || !address.specificArea || !address.phoneNumber) {
      alert('Please fill in Subcity, Specific Exact Landmark/Street, and Phone Number.');
      return;
    }
    const key = getAddressStorageKey();
    if (key) {
      localStorage.setItem(key, JSON.stringify(address));
    }
    setHasSavedAddress(true);
    setIsEditingAddress(false);
  };

  const handleRequestOrder = async () => {
    setErrorMessage('');

    if (activeItems.length === 0) {
      setErrorMessage('Please select at least one item to proceed.');
      return;
    }

    if (!address.subcity || !address.specificArea || !address.phoneNumber) {
      setErrorMessage('Please provide your subcity, exact street/landmark, and phone number.');
      setIsEditingAddress(true);
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');

    try {
     const response = await API.post('/orders/request', {
  items: activeItems.map((i) => ({
    id: i.id,
    title: i.title,
    price: i.price,
    quantity: i.selectedQuantity || i.quantity || i.minOrderQty || 1,
    imageUrl: i.imageUrl,
    storeId: Number(i.storeId || i.StoreId || 1), // 👈 Ensure storeId is attached per item!
  })),
  subtotal,
  deliveryFee,
  totalAmount: grandTotal,
  deliveryAddress: address,
});

const data = response.data;

      if (response.data.success) {
        if (onOrderSubmitted) {
          onOrderSubmitted(response.data.order);
        }
      }
    } catch (err) {
      console.error('Order Submission Error:', err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to send order request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };
 
  const getFormattedImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">
              Shopping Cart & Order Review
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {cartItems.length} item(s) in cart
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black rounded-full flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-200">
              {errorMessage}
            </div>
          )}

          {/* 1. CART ITEMS LIST WITH CHECKBOXES & MOQ */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Selected Items
            </h3>
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-slate-400 uppercase">
                Your cart is empty.
              </div>
            ) : (
              cartItems.map((item) => {
                const currentQty =
                  item.selectedQuantity || item.quantity || item.minOrderQty || 1;
                const minQty = item.minOrderQty || 1;
                const isSelected = !!selectedItemIds[item.id];

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border transition flex items-center gap-3 ${
                      isSelected
                        ? 'bg-white border-[#1E4D58]/40 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    {/* Tick Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4 accent-[#1E4D58] cursor-pointer"
                    />

                    {/* Image Preview */}
                    <div className="w-14 h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={getFormattedImageUrl(item.imageUrl)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-400">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Title & Price */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-extrabold text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs font-black text-[#1E4D58] mt-0.5">
                        {Number(item.price || 0).toLocaleString()} ETB
                      </p>
                      {minQty > 1 && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md inline-block mt-1">
                          Min Limit: {minQty}
                        </span>
                      )}
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => handleQtyChange(item, -1)}
                        className="w-6 h-6 bg-white text-slate-800 font-black rounded-lg text-xs flex items-center justify-center shadow-2xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-black px-1">{currentQty}</span>
                      <button
                        onClick={() => handleQtyChange(item, 1)}
                        className="w-6 h-6 bg-white text-slate-800 font-black rounded-lg text-xs flex items-center justify-center shadow-2xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Item */}
                    <button
                      onClick={() => onRemoveItem && onRemoveItem(item.id)}
                      className="text-slate-400 hover:text-rose-500 font-bold text-xs p-1 cursor-pointer"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* 2. SAVED DELIVERY ADDRESS SECTION (ADDIS ABABA SUBCITY & EXACT ADDRESS) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Delivery Address (Addis Ababa)
              </h3>
              {hasSavedAddress && !isEditingAddress && (
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(true)}
                  className="text-xs font-bold text-[#1E4D58] hover:underline cursor-pointer"
                >
                  Edit Address
                </button>
              )}
            </div>

            {!isEditingAddress && hasSavedAddress ? (
              <div className="text-xs text-slate-700 space-y-1 font-medium bg-white p-3 rounded-xl border border-slate-200">
                <p>
                  <strong>Subcity:</strong> {address.subcity} <span className="text-emerald-600 font-bold">(Delivery Fee: {deliveryFee} ETB)</span>
                </p>
                
                <p>
                  <strong>Exact Street / Landmark:</strong> {address.specificArea}
                </p>
                <p>
                  <strong>Phone Number:</strong> {address.phoneNumber}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveAddress} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Select Addis Ababa Subcity (Calculates Delivery Fee)
                  </label>
                 <select
  value={address.subcity}
  onChange={(e) => setAddress({ ...address, subcity: e.target.value })}
  required
  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E4D58]"
>
  {ADDIS_SUBCITIES.map((s) => (
    <option key={s.name} value={s.name}>
      {s.name} — ({subcityFees[s.name] ?? s.defaultFee} ETB delivery)
    </option>
  ))}
</select>
                </div>

<input
                  type="text"
                  placeholder="Exact Street, Building Name or Landmark (Required)"
                  value={address.specificArea}
                  onChange={(e) => setAddress({ ...address, specificArea: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#1E4D58]"
                />
                <div className="grid grid-cols-2 gap-2">
                  
                  <input
                    type="tel"
                    placeholder="Phone (e.g., 0911223344)"
                    value={address.phoneNumber}
                    onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                    required
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#1E4D58]"
                  />
                </div>

                

                <button
                  type="submit"
                  className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition cursor-pointer"
                >
                  Save Address for Future Orders
                </button>
              </form>
            )}
          </div>

          {/* 3. TRANSPARENT PRICE BREAKDOWN */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-xs font-bold text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Products Subtotal:</span>
              <span className="text-slate-900">{subtotal.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery Fee ({address.subcity || 'Standard'}):</span>
              <span className="text-slate-900">{deliveryFee.toLocaleString()} ETB</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-black text-[#1E4D58]">
              <span>Grand Total:</span>
              <span>{grandTotal.toLocaleString()} ETB</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic pt-1">
              * Note: Delivery fee is paid directly upon physical delivery to your exact address. Product total is transferred via bank transfer after merchant approval.
            </p>
          </div>
        </div>

        {/* Platform Maintenance Banner (Displays automatically if you toggle off) */}
{!platformOpen && (
  <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl mb-4 space-y-1 shadow-sm">
    <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
      <span>⚠️ Scheduled Maintenance & Order Pause</span>
    </div>
    <p className="text-xs text-amber-800 font-semibold leading-relaxed">
      F-COMMERCE order processing is temporarily paused for system optimization. We will resume accepting requests shortly. Thank you for your patience!
    </p>
  </div>
)}

        {/* Modal Footer / Action Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <button
  type="button"
  onClick={handleRequestOrder}
  disabled={submitting || activeItems.length === 0 || !platformOpen}
  className={`w-full py-3.5 text-white font-black text-xs sm:text-sm rounded-2xl uppercase tracking-wider shadow-md transition ${
    !platformOpen 
      ? 'bg-amber-600 hover:bg-amber-700 cursor-not-allowed' 
      : 'bg-[#1E4D58] hover:bg-[#163C45] cursor-pointer'
  } disabled:opacity-50`}
>
  {!platformOpen 
    ? '⚠️ Orders Paused (Platform Maintenance)' 
    : (submitting ? 'Sending Order Request...' : 'Request Order (10 Min Merchant Timeout)')}
</button>
        </div>
      </div>
    </div>
  );
}
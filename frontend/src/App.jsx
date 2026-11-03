// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AdBanner from './components/AdBanner';
import axios from 'axios';
import ProductCatalog from './components/ProductCatalog';
import ProductDetailPage from './components/ProductDetailPage';
import CartCheckoutModal from './components/CartCheckoutModal';
import OrderStatusPage from './components/OrderStatusPage';
import RegisterModal from './components/RegisterModal';
import CreateStoreModal from './components/CreateStoreModal';
import MyStoreDashboard from './components/MyStoreDashboard';
import logoImage from './assets/logo.png';
import TrackOrderPage from './components/TrackOrderPage';
import OrderHistoryPage from './components/OrderHistoryPage';
import UserSettingsPage from './components/UserSettingsPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState(false);

  // Persistence for user login state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      return null;
    }
  });

  const [currentStore, setCurrentStore] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const [activeView, setActiveView] = useState({ page: 'home', product: null, categoryId: null, orderId: null });
  const [activeOrderId, setActiveOrderId] = useState(null);

  // 1. Initialize Cart from localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('fcommerce_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      return [];
    }
  });

  const getWishlistKey = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?.id || user?.phone || currentUser?.id || currentUser?.phone;
    return userId ? `fcommerce_wishlist_${userId}` : null;
  };

  const [wishlist, setWishlist] = useState(() => {
    try {
      const key = getWishlistKey();
      if (!key) return []; // Empty if not signed in
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      return [];
    }
  });

  const [currentView, setCurrentView] = useState('main'); // 'main' | 'admin' | 'store'

  // ==========================================
  // ALL useEffect HOOKS (Unconditional Order)
  // ==========================================
  useEffect(() => {
    // 1. Register the Service Worker in the background
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('✅ Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.error('❌ Service Worker registration failed:', err);
        });
    }

    // 2. Poll/Check for new broadcast notifications every 5 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/broadcast-client');
        const data = await res.json();

        if (data.success && data.broadcasts && data.broadcasts.length > 0) {
          const latestBroadcast = data.broadcasts[0];
          const lastSeenId = localStorage.getItem('last_seen_broadcast_id');

          // If this is a new broadcast the user hasn't seen yet
          if (String(latestBroadcast.id) !== lastSeenId) {
            localStorage.setItem('last_seen_broadcast_id', String(latestBroadcast.id));

            // Trigger native browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('FCOMMERCE Announcement', {
                body: latestBroadcast.message,
                icon: '/logo.png',
                badge: '/logo.png',
              });
            }
          }
        }
      } catch (err) {
        // Silently handle offline/network checks
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // 3. Auto-save Cart whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('fcommerce_cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Error saving cart:', err);
    }
  }, [cart]);

  useEffect(() => {
    try {
      const key = getWishlistKey();
      if (key) {
        localStorage.setItem(key, JSON.stringify(wishlist));
      }
    } catch (err) {
      console.error('Error saving wishlist:', err);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      const key = getWishlistKey();
      if (!key) {
        setWishlist([]); // Clear if logged out
        return;
      }
      const saved = localStorage.getItem(key);
      setWishlist(saved ? JSON.parse(saved) : []);
    } catch (err) {
      setWishlist([]);
    }
  }, [currentUser?.id, currentUser?.phone]);

  // Load active session and store from local cache
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Error loading session user:', err);
      }
    }

    const savedStore = localStorage.getItem('store');
    if (savedStore) {
      try {
        setCurrentStore(JSON.parse(savedStore));
      } catch (err) {
        console.error('Error loading session store:', err);
      }
    }

    return () => clearTimeout(timer);
  }, []);

  // Fetch the latest merchant store data on mount
  useEffect(() => {
    const syncUserAndStore = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get('/api/stores/my-store', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success && response.data.store) {
          const userStore = response.data.store;
          setCurrentStore(userStore);
          localStorage.setItem('store', JSON.stringify(userStore));

          setCurrentUser((prevUser) => {
            if (!prevUser) return prevUser;
            const updatedUser = { ...prevUser, role: 'vendor', store: userStore };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
          });
        }
      } catch (err) {
        console.log('No store linked to this account.');
      }
    };

    syncUserAndStore();
  }, []);

  
  if (currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentView === 'admin') {
    return (
      <SuperAdminDashboard 
        currentUser={currentUser} 
        onLogout={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('store');
          setCurrentUser(null);
          setCurrentStore(null);
          setCurrentView('main');
        }} 
        onBackToMain={() => setCurrentView('main')}
      />
    );
  }
  // Wishlist Toggle Handler
  const handleToggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  // Add to Cart Handler
  const handleAddToCart = (productWithQty) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === productWithQty.id);
      const qty = productWithQty.selectedQuantity || productWithQty.quantity || productWithQty.minOrderQty || 1;
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].selectedQuantity = qty;
        return updated;
      } else {
        return [...prev, { ...productWithQty, selectedQuantity: qty }];
      }
    });
    
  };

  // Trigger Auth Modal for guest users
  const handleOpenAuth = (actionKey = null) => {
    if (actionKey) setPendingAction(actionKey);
    setIsRegisterOpen(true);
  };

  // Controlled "My Store" button routing
  const handleOpenMyStore = () => {
    if (!currentUser) {
      handleOpenAuth('MY_STORE');
      return;
    }

    const hasStore = currentUser.store || currentStore;
    if (hasStore) {
      setActiveView({ page: 'my-store', categoryId: null });
    } else {
      setIsCreateStoreOpen(true);
    }
  };

  const handleOpenDeliveryPortal = () => {
    if (!currentUser) {
      handleOpenAuth('DELIVERY');
    } else {
      setActiveView({ page: 'delivery', categoryId: null });
    }
  };

  

  const handleLogout = () => {
  // Clear address for whoever was logged in before logging out
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?.id || user?.phone;
  if (userId) {
    localStorage.removeItem(`user_delivery_address_${userId}`);
  }

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('store');
  localStorage.removeItem('shippingAddress'); // Just in case of legacy keys
  
  setCurrentUser(null);
  setCurrentStore(null);
  setActiveView({ page: 'home', categoryId: null });
};

  const handleRegisterSuccess = (user, storeData = null) => {
    setCurrentUser(user);
    setIsRegisterOpen(false);

    const activeStore = storeData || user.store;
    if (activeStore) {
      setCurrentStore(activeStore);
      localStorage.setItem('store', JSON.stringify(activeStore));
    }

    if (pendingAction === 'MY_STORE') {
      if (activeStore) {
        setActiveView({ page: 'my-store', categoryId: null });
      } else {
        setIsCreateStoreOpen(true);
      }
    } else if (pendingAction === 'DELIVERY') {
      setActiveView({ page: 'delivery', categoryId: null });
    }

    setPendingAction(null);
  };

  const handleCreateStoreSuccess = (newStore) => {
    setCurrentStore(newStore);
    localStorage.setItem('store', JSON.stringify(newStore));

    setCurrentUser((prevUser) => {
      const updatedUser = { ...prevUser, role: 'vendor' };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });

    setIsCreateStoreOpen(false);
    setActiveView({ page: 'my-store', categoryId: null });
  };
  
const handleNavigation = (pageId, param = null) => {
  if (pageId === 'category') {
    setActiveView({ page: 'category', categoryId: param });
  } else {
    // For home, track-order, orders, settings, etc.
    setActiveView({ page: pageId });
  }
};

  return (
    <>
      {/* Loading Splash Screen */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <img src={logoImage} alt="FCOMMERCE Logo" className="w-24 h-24 object-contain animate-pulse" />
          <h1 className="mt-4 text-2xl font-black text-[#1E4D58] tracking-widest uppercase">
            FCOMMERCE
          </h1>
        </div>
      )}

      <div className={`min-h-screen bg-slate-50 flex flex-col font-sans transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        
       {/* Sidebar Drawer */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenMyStore={handleOpenMyStore}
          onOpenDeliveryPortal={handleOpenDeliveryPortal}
          onOpenAuth={handleOpenAuth}
          onNavigate={handleNavigation}
          currentUser={currentUser}
          cartItemCount={cart.reduce((sum, item) => sum + (item.selectedQuantity || 1), 0)}
          onOpenCart={() => {
            setIsSidebarOpen(false); 
            setIsCartOpen(true);     
          }}
        />

        {/* DYNAMIC VIEW ROUTER */}
        {activeView.page === 'my-store' ? (
          <MyStoreDashboard
            currentStore={currentStore}
            currentUser={currentUser}
            onOpenCreateStore={() => setIsCreateStoreOpen(true)}
            onBackToMain={() => setActiveView({ page: 'catalog', product: null })}
            onLogout={handleLogout}
          />
        ) : (
          <>
            <Navbar
              currentUser={currentUser}
              onOpenAdmin={() => setCurrentView('admin')}
              currentStore={currentStore}
              onOpenAuth={() => setIsRegisterOpen(true)}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              onOpenMyStore={handleOpenMyStore}
              onOpenCreateStore={() => setIsCreateStoreOpen(true)}
              onLogout={handleLogout}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
              {(activeView.page === 'home' || activeView.page === 'catalog') && (
  <AdBanner onPromoteAdClick={() => {}} />
)}
              {activeView.page === 'home' && (
                <ProductCatalog
                  selectedStore={activeView.selectedStore}
                  onSelectProduct={(product) => {
                    setActiveView({ page: 'product-detail', product });
                  }}
                  wishlist={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                />
              )}

              {activeView.page === 'catalog' && (
                <ProductCatalog
                  selectedStore={activeView.selectedStore}
                  onSelectProduct={(product) => {
                    setActiveView({ page: 'product-detail', product });
                  }}
                  wishlist={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                />
              )}

              {/* Product Detail View */}
              {activeView.page === 'product-detail' && (
                <ProductDetailPage
                  product={activeView.product}
                  currentUser={currentUser}
                  onBack={() => setActiveView({ page: 'catalog', product: null })}
                  onOpenCart={() => setActiveView({ page: 'cart-checkout' })}
                  onOpenWishlist={() => setActiveView({ page: 'wishlist' })}
                  cartCount={cart.length}
                  wishlistCount={wishlist.length}
                  isWishlisted={wishlist.some((item) => item.id === activeView.product?.id)}
                  onToggleWishlist={handleToggleWishlist}
                  onAddToCart={(prod) => handleAddToCart(prod)}
                  onDirectOrder={(prod) => {
                    handleAddToCart(prod);
                    setActiveView({ page: 'cart-checkout' });
                  }}
                  onSelectProduct={(prod) => {
                    setActiveView({ page: 'product-detail', product: prod });
                  }}
                  onSelectStore={(storeName) => {
                    setActiveView({ page: 'catalog', selectedStore: storeName, product: null });
                  }}
                />
              )}

             {/* Wishlist View - Clickable items directing to Product Detail */}
              {activeView.page === 'wishlist' && (
                <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 bg-white rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-base font-black uppercase text-slate-900">My Wishlist ({wishlist.length})</h2>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">Click any item to view details and order</p>
                    </div>
                    <button 
                      onClick={() => setActiveView({ page: 'catalog' })}
                      className="text-xs font-bold text-[#1E4D58] hover:underline cursor-pointer"
                    >
                      ← Back to Catalog
                    </button>
                  </div>

                  {wishlist.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Your wishlist is empty</p>
                      <p className="text-xs text-slate-500">Tap the heart icon on any product to save items here for later.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {wishlist.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setActiveView({ page: 'product-detail', product: item })}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs cursor-pointer hover:border-[#1E4D58] hover:shadow-md transition group"
                        >
                          <div className="flex items-center space-x-3">
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:5000${item.imageUrl}`} 
                                alt={item.title} 
                                className="w-12 h-12 object-cover rounded-xl border" 
                              />
                            )}
                            <div>
                              <h4 className="text-xs font-black text-slate-900 line-clamp-1 group-hover:text-[#1E4D58] transition">{item.title}</h4>
                              <p className="text-xs font-extrabold text-[#1E4D58] mt-0.5">{Number(item.price || 0).toLocaleString()} ETB</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents opening product detail when removing
                              handleToggleWishlist(item);
                            }}
                            className="w-8 h-8 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-black text-xs cursor-pointer transition"
                            title="Remove from wishlist"
                          >
                            ♥
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              
             
              {/* Cart & Checkout Modal View */}
              {activeView.page === 'cart-checkout' && (
               <CartCheckoutModal
  isOpen={true}
  onClose={() => setActiveView({ page: 'catalog', product: null })}
  cartItems={cart}
  currentUser={currentUser} 
  onUpdateQuantity={(itemId, newQty) => {
    setCart((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, selectedQuantity: newQty } : item))
    );
  }}
  onRemoveItem={(itemId) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }}
  onOrderSubmitted={(createdOrder) => {
    setActiveOrderId(createdOrder.id);
    setActiveView({ page: 'order-status', orderId: createdOrder.id });
    setCart([]);
  }}
/>
              )}

              {/* Order Status & 10-Min Timer View */}
              {activeView.page === 'order-status' && (
                <OrderStatusPage
                  orderId={activeView.orderId || activeOrderId}
                  onBackToMarketplace={() => setActiveView({ page: 'catalog', product: null })}
                  onTryAnotherStore={() => setActiveView({ page: 'catalog', product: null })}
                />
              )}

              {activeView.page === 'track-order' && (
                <TrackOrderPage 
                  currentUser={currentUser} 
                  onBackToMarketplace={() => setActiveView({ page: 'catalog', product: null })} 
                />
              )}

              {/* Order History View */}
              {activeView.page === 'orders' && (
                <OrderHistoryPage 
                  currentUser={currentUser} 
                  onBackToMarketplace={() => setActiveView({ page: 'catalog', product: null })} 
                />
              )}

              {/* Delivery Portal View */}
              {activeView.page === 'delivery' && currentUser && (
                <div className="bg-white p-6 rounded-2xl shadow-xs border-l-4 border-blue-600">
                  <h2 className="text-lg font-black text-slate-900">Delivery Partner Portal</h2>
                  <p className="text-xs text-slate-600 mt-1">Driver Contact: {currentUser.phone}</p>
                </div>
              )}

            </main>
          </>
        )}

        {activeView.page === 'settings' && (
  <UserSettingsPage 
    currentUser={currentUser}
    onUserUpdated={(updatedUser) => {
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }}
    onBackToMarketplace={() => setActiveView({ page: 'catalog' })}
  />
)}

        {/* Global Modals */}
        <RegisterModal
          isOpen={isRegisterOpen}
          onClose={() => setIsRegisterOpen(false)}
          onRegisterSuccess={handleRegisterSuccess}
        />
        <CreateStoreModal
  isOpen={isCreateStoreOpen}
  onClose={() => setIsCreateStoreOpen(false)}
  currentUser={currentUser}
  existingStore={currentStore} // 👈 Passes rejected store data so form pre-fills
  onCreateStoreSuccess={handleCreateStoreSuccess}
/>
      </div>
    </>
  );
}

export default App;
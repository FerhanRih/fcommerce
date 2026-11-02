// frontend/src/components/Navbar.jsx
import React from 'react';
import { Menu, ShoppingBag, Store, LogIn, LogOut, Phone } from 'lucide-react';
import defaultLogo from '../assets/logo.png'; // Import asset directly

const Navbar = ({ 
  onOpenAuth, 
  onToggleSidebar, 
  currentUser, 
  currentStore,
  onOpenMyStore, 
  onOpenCreateStore,
  onLogout, 
  logoSrc 
}) => {
  const isVendor = currentUser?.role === 'vendor' || Boolean(currentStore);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Sidebar Toggle + Logo (Fixed Spacing) */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <div className="flex items-center space-x-3 cursor-pointer">
            <img 
              src={logoSrc || defaultLogo} 
              alt="FCOMMERCE Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultLogo;
              }}
            />
            {/* Added left margin and distinct spacing so letters never touch */}
            <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#1E4D58]">
              FCOMMERCE
            </span>
          </div>
        </div>

        {/* Right Side: Store Action + Auth Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Conditional Store Button */}
          {isVendor ? (
            <button
              onClick={onOpenMyStore}
              className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#1E4D58] bg-[#1E4D58]/10 hover:bg-[#1E4D58]/15 rounded-xl transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden xs:inline">My Store</span>
            </button>
          ) : (
            <button
              onClick={currentUser ? onOpenCreateStore : onOpenAuth}
              className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-[#1E4D58] hover:bg-[#163C45] rounded-xl transition cursor-pointer shadow-xs"
            >
              <Store className="w-4 h-4" />
              <span className="hidden xs:inline">Create Store</span>
            </button>
          )}

          {/* Authenticated State */}
          {currentUser ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-800 border border-slate-200">
                <Phone className="w-3.5 h-3.5 text-[#1E4D58]" />
                <span className="font-mono text-slate-700">
                  {currentUser.phone || currentUser.name || 'User'}
                </span>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Compact Modern Sign In Button */
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#1E4D58] hover:bg-[#163C45] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;
// frontend/src/components/SuperAdminDashboard.jsx
import React, { useState } from 'react';
import { Menu, LogOut, ArrowLeft, Shield, X, ChevronRight } from 'lucide-react';
import defaultLogo from '../assets/logo.png';

// Import all 9 modular pages from the admin subfolder
import SuperAdminOverview from './admin/SuperAdminOverview';
import SuperAdminOrderLifecycle from './admin/SuperAdminOrderLifecycle';
import SuperAdminDeliveryHub from './admin/SuperAdminDeliveryHub';
import SuperAdminStoreApproval from './admin/SuperAdminStoreApproval';
import SuperAdminAdBanners from './admin/SuperAdminAdBanners';
import SuperAdminRoles from './admin/SuperAdminRoles';
import SuperAdminFleet from './admin/SuperAdminFleet';
import SuperAdminAllOrders from './admin/SuperAdminAllOrders';
import SuperAdminIntelligence from './admin/SuperAdminIntelligence';
import { Settings } from 'lucide-react';
import UserSettings from './admin/UserSettings';
import SuperAdminBroadcast from './admin/SuperAdminBroadcast';

const SuperAdminDashboard = ({ currentUser, onLogout, onBackToMain }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: '1. Dashboard & Analytics' },
    { id: 'orders', label: '2. Order Lifecycle Hub' },
    { id: 'delivery', label: '3. Delivery Dispatch' },
    { id: 'store-approval', label: '4. Store Approvals' },
    { id: 'ad-banners', label: '5. Ad Banners & Pricing' },
    { id: 'roles', label: '6. Add Role & Staff' },
    { id: 'fleet', label: '7. Fleet Logistics Hub' },
    { id: 'all-orders', label: '8. Master All Orders' },
    { id: 'intelligence', label: '9. Marketplace Intelligence' },
    { id: 'broadcast', label: '10. Broadcast & Notifications' },
    { id: 'settings', label: '11. Settings' },
  ];

  const activeItem = navItems.find((item) => item.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* MATCHING NAVBAR HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left Side: Sidebar Toggle + Brand Logo (Identical Spacing) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
            
            <div 
              onClick={onBackToMain}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <img 
                src={defaultLogo} 
                alt="FCOMMERCE Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultLogo;
                }}
              />
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#1E4D58]">
                  FCOMMERCE
                </span>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider -mt-1 hidden sm:inline">
                  Super Admin Center
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Navigation Badges + Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* User Indicator Badge */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-800 border border-slate-200">
              <Shield className="w-3.5 h-3.5 text-[#1E4D58]" />
              <span className="font-mono text-slate-700">
                {currentUser?.phone || currentUser?.name || 'Super Admin'}
              </span>
            </div>

            {/* Back to Marketplace */}
            <button
              onClick={onBackToMain}
              className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-[#1E4D58] bg-[#1E4D58]/10 hover:bg-[#1E4D58]/15 rounded-xl transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Main Marketplace</span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>
      </header>

      {/* MAIN CONTAINER LAYOUT */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6 relative">

        {/* BACKDROP OVERLAY FOR SIDEBAR ON MOBILE */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* RESPONSIVE FLOATING SIDEBAR */}
        <aside className={`
          fixed lg:static top-[73px] left-0 bottom-0 z-30 w-72 bg-white border-r lg:border border-slate-200 
          p-5 shrink-0 shadow-xl lg:shadow-xs rounded-r-3xl lg:rounded-3xl space-y-2 h-fit
          transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="px-2 py-1 text-[11px] font-black text-slate-400 uppercase tracking-wider flex justify-between items-center mb-1">
            <span>Control Modules</span>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-500">11 Modules</span>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black transition cursor-pointer ${
                    isActive 
                      ? 'bg-[#1E4D58] text-white shadow-md shadow-[#1E4D58]/20' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </aside>

        {/* DYNAMIC CONTENT AREA */}
        <main className="flex-1 min-w-0 space-y-4">
          
          {/* Active Module Header */}
          <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Active</span>
            </div>
            <span className="text-xs font-black text-[#1E4D58] bg-[#1E4D58]/10 px-3 py-1 rounded-xl">
              {activeItem?.label}
            </span>
          </div>

          {/* Render Active Sub-Page */}
          <div>
            {activeTab === 'dashboard' && <SuperAdminOverview />}
            {activeTab === 'orders' && <SuperAdminOrderLifecycle />}
            {activeTab === 'delivery' && <SuperAdminDeliveryHub />}
            {activeTab === 'store-approval' && <SuperAdminStoreApproval />}
            {activeTab === 'ad-banners' && <SuperAdminAdBanners />}
            {activeTab === 'roles' && <SuperAdminRoles />}
            {activeTab === 'fleet' && <SuperAdminFleet />}
            {activeTab === 'all-orders' && <SuperAdminAllOrders />}
            {activeTab === 'intelligence' && <SuperAdminIntelligence />}
            {activeTab === 'broadcast' && <SuperAdminBroadcast />}
            {activeTab === 'settings' && <UserSettings />}
          </div>

        </main>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
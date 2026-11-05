// frontend/src/components/admin/SuperAdminOverview.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Store, ShoppingCart, CheckCircle, Clock, XCircle, 
  BarChart3, RefreshCw, Megaphone, ShieldAlert, CreditCard, Truck 
} from 'lucide-react';
import PlatformStatusControl from './PlatformStatusControl';
import API from '../../services/api'; 

const SuperAdminOverview = () => {
 const [stats, setStats] = useState({
    totalUsers: 0,
    staffCount: 0,
    totalCustomers: 0,
    totalStores: 0,
    activeStores: 0, 
    pendingStores: 0,
    adBannerRequests: 0,
    runningAds: 0,
    totalOrders: 0,
    pendingRequests: 0,
    waitingPayment: 0,
    waitingVerification: 0,
    inTransit: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportFilter, setReportFilter] = useState('monthly');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.get('/admin/dashboard-stats');
      const data = response.data;

      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.message || 'Failed to load analytics.');
      }
    } catch (err) {
      console.error('Fetch Stats Error:', err);
      setError('Server connection error. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center space-x-2 text-slate-500 font-bold text-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-[#1E4D58]" />
          <span>Loading live platform statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-700 text-xs font-semibold flex items-center justify-between">
        <span>{error}</span>
        <button 
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl font-black hover:bg-rose-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🛑 SUPER ADMIN GLOBAL KILL-SWITCH TOGGLE */}
      <PlatformStatusControl />
      {/* HEADER TITLE & REFRESH */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Platform Overview & Analytics</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time aggregate data across all users, stores, ad campaigns, and order stages.</p>
        </div>
        <button
          onClick={fetchDashboardStats}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* TOP METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* USERS DEMOGRAPHICS BREAKDOWN */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Demographics</span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500 font-bold">Total Accounts:</span>
              <span className="text-base font-black text-slate-900">{stats.totalUsers}</span>
            </div>
            <div className="flex justify-between items-baseline border-t border-slate-100 pt-1">
              <span className="text-xs text-slate-500 font-bold">Regular Users (No Store):</span>
              <span className="text-sm font-black text-emerald-600">{stats.totalCustomers}</span>
            </div>
            <div className="flex justify-between items-baseline border-t border-slate-100 pt-1">
              <span className="text-xs text-slate-500 font-bold">Staff & Admins:</span>
              <span className="text-sm font-black text-[#1E4D58]">{stats.staffCount}</span>
            </div>
          </div>
        </div>
     
        {/* STORES & APPROVALS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stores Overview</span>
            <div className="p-2 bg-teal-50 text-[#1E4D58] rounded-2xl">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-black text-[#1E4D58]">{stats.activeStores || 0}</div>
              <div className="text-[10px] text-slate-500 font-bold mt-1">Active Stores</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-amber-600">{stats.pendingStores || 0}</div>
              <div className="text-[10px] text-amber-600 font-extrabold mt-1">Awaiting Approval</div>
            </div>
          </div>
        </div>

        {/* AD CAMPAIGNS & REQUESTS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ad Campaigns</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-2xl">
              <Megaphone className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-black text-purple-600">{stats.runningAds}</div>
              <div className="text-[10px] text-slate-500 font-bold mt-1">Running Ads</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-rose-600">{stats.adBannerRequests}</div>
              <div className="text-[10px] text-rose-600 font-extrabold mt-1">Ad Requests</div>
            </div>
          </div>
        </div>

      </div>

      {/* GRANULAR ORDER PIPELINE STAGES */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">Order Lifecycle & Pipeline Breakdown</h3>
            <p className="text-xs text-slate-500 font-medium">Real-time counts across every step of the order fulfillment workflow.</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-bold">Total Orders:</span>
            <div className="text-xl font-black text-indigo-600">{stats.totalOrders}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 text-center">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase">On Request</div>
            <div className="text-xl font-black text-indigo-600 mt-1">{stats.pendingRequests}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Waiting Payment</div>
            <div className="text-xl font-black text-amber-600 mt-1">{stats.waitingPayment}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Waiting Verification</div>
            <div className="text-xl font-black text-purple-600 mt-1">{stats.waitingVerification}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase">In Transit</div>
            <div className="text-xl font-black text-sky-600 mt-1">{stats.inTransit}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Delivered</div>
            <div className="text-xl font-black text-emerald-600 mt-1">{stats.deliveredOrders}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Cancelled/Rejected</div>
            <div className="text-xl font-black text-rose-600 mt-1">{stats.cancelledOrders}</div>
          </div>
        </div>
      </div>

      {/* FINANCIAL & SYSTEM ANALYTICS SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Financial Volume & Growth Metrics</h3>
            <p className="text-xs text-slate-500 font-medium">Aggregated transaction volumes across daily, weekly, monthly, and yearly intervals.</p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl space-x-1">
            {['daily', 'weekly', 'monthly', 'yearly'].map((tab) => (
              <button
                key={tab}
                onClick={() => setReportFilter(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition cursor-pointer ${
                  reportFilter === tab ? 'bg-white text-[#1E4D58] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-2">
          <BarChart3 className="w-10 h-10 text-slate-300" />
          <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
            {reportFilter.toUpperCase()} Performance Analytics Graph
          </h4>
          <p className="text-xs text-slate-400 max-w-sm">
            Showing verified marketplace gross merchandise volume (GMV) and active vendor order distributions.
          </p>
        </div>
      </div>

    </div>
  );
};

export default SuperAdminOverview;
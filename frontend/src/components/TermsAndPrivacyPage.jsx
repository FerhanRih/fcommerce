// frontend/src/components/TermsAndPrivacyPage.jsx
import React, { useState } from 'react';
import { ShieldCheck, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

const TermsAndPrivacyPage = ({ onBackToMarketplace }) => {
  const [activeTab, setActiveTab] = useState('terms');

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#1E4D58]" />
            Legal & Operational Policies
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Official guidelines governing B2B merchant verification, order flow, receipt verification, and platform delivery.
          </p>
        </div>
        <button
          onClick={onBackToMarketplace}
          className="inline-flex items-center space-x-2 text-xs font-black text-[#1E4D58] bg-[#1E4D58]/10 hover:bg-[#1E4D58]/20 px-4 py-2.5 rounded-xl transition cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </button>
      </div>

      {/* Tabs Toggle */}
      <div className="flex bg-slate-200 p-1.5 rounded-2xl w-full max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl uppercase tracking-wider transition cursor-pointer ${
            activeTab === 'terms' ? 'bg-[#1E4D58] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Terms & Conditions
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl uppercase tracking-wider transition cursor-pointer ${
            activeTab === 'privacy' ? 'bg-[#1E4D58] text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Privacy Policy
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-slate-700 text-xs leading-relaxed">
        {activeTab === 'terms' ? (
          <div className="space-y-6">
            <section className="space-y-2 border-b border-slate-100 pb-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1E4D58]" />
                1. Merchant Verification & Store Approvals
              </h2>
              <p>
                To maintain high quality across our niche categories (Perfumes, Cosmetics, Jewelry, Watches, and Eyewear), all store registrations are subject to manual inspection and Super Admin approval. Stores must operate as legitimate wholesale vendors or boutique merchants. We reserve the right to decline or suspend stores that fail physical verification or list unverified products.
              </p>
            </section>

            <section className="space-y-2 border-b border-slate-100 pb-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1E4D58]" />
                2. B2B Order Flow & Direct Payments
              </h2>
              <p>
                Our platform operates on a direct-merchant payment model:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600 font-medium">
                <li>Buyers place order requests respecting Minimum Order Quantities (MOQs).</li>
                <li>Merchants accept or modify item quantities based on actual stock.</li>
                <li>Buyers transfer payment directly to the merchant's listed account and upload a payment receipt.</li>
                <li>Merchants verify receipt authenticity before dispatch authorization.</li>
              </ul>
            </section>

            <section className="space-y-2 border-b border-slate-100 pb-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1E4D58]" />
                3. Quality Inspection & Delivery Guarantee
              </h2>
              <p>
                Before picking up any package for fulfillment, our platform couriers inspect the item at the merchant's store to verify it matches the exact product requested. If an item is damaged during platform courier transit, FCOMMERCE guarantees full platform handling and resolution for the affected order.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                4. Product Authenticity
              </h2>
              <p>
                Merchants are strictly required to supply genuine items as listed in their digital store. Misrepresentation of product quality or sending inaccurate stock will lead to immediate store suspension.
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="space-y-2 border-b border-slate-100 pb-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1E4D58]" />
                1. Account Information We Collect
              </h2>
              <p>
                We collect your phone number, user/store name, primary business location in Addis Ababa, and uploaded payment receipts strictly to facilitate B2B order processing, delivery routing, and account security authentication.
              </p>
            </section>

            <section className="space-y-2 border-b border-slate-100 pb-4">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                2. Notifications (Browser & SMS)
              </h2>
              <p>
                By registering on FCOMMERCE, you agree to receive real-time web browser notifications and direct operational SMS messages (such as order status updates, receipt verification alerts, and store approval notices) dispatched directly to your registered mobile number.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                3. Data Privacy & Confidentiality
              </h2>
              <p>
                Your store details, sales history, and customer phone numbers are strictly used for order delivery and internal platform records. We do not sell or share business credentials or contact lists with external third-party advertisers.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default TermsAndPrivacyPage;
'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import OrderForm from '@/components/OrderForm';
import ScanRequestForm from '@/components/ScanRequestForm';
import SubmitBar from '@/components/SubmitBar';
import { cn } from '@/lib/utils';

type Tab = 'order' | 'scan';

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('order');

  // Each tab independently tracks stage + summary so the footer stays correct
  // when switching tabs without losing state.
  const [orderStage, setOrderStage] = useState('idle');
  const [orderSummary, setOrderSummary] = useState<string | undefined>();
  const [scanStage, setScanStage] = useState('idle');
  const [scanSummary, setScanSummary] = useState<string | undefined>();

  const activeStage = tab === 'order' ? orderStage : scanStage;
  const activeSummary = tab === 'order' ? orderSummary : scanSummary;

  return (
    <>
      <Header />

      {/* Main content — pt-20 clears fixed header, pb-28 clears fixed footer */}
      <main className="min-h-screen bg-gray-50 pt-20 pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

          {/* Page title */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">
              {tab === 'order'
                ? 'New Lab Order for Accugen - Digital Dental Lab'
                : 'Request an Intraoral Scan from Accugen Digital Dental Lab'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {tab === 'order'
                ? 'Fill in the case details and attach your files'
                : 'Book a scanning appointment with our team'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-6 shadow-sm">
            <TabBtn active={tab === 'order'} onClick={() => setTab('order')}>
              Lab Order
            </TabBtn>
            <TabBtn active={tab === 'scan'} onClick={() => setTab('scan')}>
              Request Scan
            </TabBtn>
          </div>

          {tab === 'order' ? (
            <OrderForm
              onStatusChange={(s, sum) => { setOrderStage(s); setOrderSummary(sum); }}
            />
          ) : (
            <ScanRequestForm
              onStatusChange={(s, sum) => { setScanStage(s); setScanSummary(sum); }}
            />
          )}
        </div>
      </main>

      {/* Single root-level sticky footer — lives outside all forms and containers.
          The button targets the active form via the HTML `form` attribute. */}
      <SubmitBar
        label={tab === 'order' ? 'Submit Order' : 'Request Scan'}
        stage={activeStage}
        formId={tab === 'order' ? 'order-form' : 'scan-form'}
        uploadingLabel="Uploading files…"
        submittingLabel={tab === 'order' ? 'Submitting order…' : 'Submitting…'}
        summary={activeSummary}
      />
    </>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50',
      )}
    >
      {children}
    </button>
  );
}

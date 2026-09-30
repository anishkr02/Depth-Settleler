import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Zap, CheckCircle2, Clock, XCircle, ArrowRight, ExternalLink, 
  ShieldAlert, RefreshCw, AlertCircle, Ban, QrCode, Check, Copy 
} from 'lucide-react';

export default function SettleModal({ group, currentUser, onClose, onSettlementUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // tx_id or 'cancel' or 'generate'
  const [qrModalTx, setQrModalTx] = useState(null);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getSettlements(group.id);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [group.id]);

  const handleGenerateSettlement = async () => {
    try {
      setActionLoading('generate');
      setError('');
      await api.settleGroup(group.id);
      await fetchSettlements();
      if (onSettlementUpdated) onSettlementUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (txId) => {
    try {
      setActionLoading(txId);
      setError('');
      await api.markPaid(txId);
      await fetchSettlements();
      if (onSettlementUpdated) onSettlementUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async (txId) => {
    try {
      setActionLoading(txId);
      setError('');
      await api.confirmPayment(txId);
      await fetchSettlements();
      if (onSettlementUpdated) onSettlementUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (txId) => {
    try {
      setActionLoading(txId);
      setError('');
      await api.denyPayment(txId);
      await fetchSettlements();
      if (onSettlementUpdated) onSettlementUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSettlement = async () => {
    if (!window.confirm('Are you sure you want to cancel the settlement plan and reopen this group?')) {
      return;
    }
    try {
      setActionLoading('cancel');
      setError('');
      await api.cancelSettlement(group.id);
      await fetchSettlements();
      if (onSettlementUpdated) onSettlementUpdated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const hasSettlements = data?.settlements && data.settlements.length > 0;
  const canCancel = hasSettlements && data.settlements.every((s) => s.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-olive-primary text-white flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Settlement Dashboard</h3>
              <p className="text-xs text-slate-500 font-medium">Optimal payments & UPI verification</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xl p-1">✕</button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-olive-600" />
            <span className="text-xs font-semibold">Loading settlement plan...</span>
          </div>
        ) : !hasSettlements ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-olive-50 text-olive-primary flex items-center justify-center mx-auto">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">No Settlement Plan Generated Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Running Settle Up locks all expenses and computes the mathematically minimum transactions to zero out everyone's balance.
              </p>
            </div>

            {group.is_admin ? (
              <button
                onClick={handleGenerateSettlement}
                disabled={actionLoading === 'generate'}
                className="px-6 py-3 bg-olive-primary hover:bg-olive-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-olive-primary/20 transition active:scale-[0.98]"
              >
                {actionLoading === 'generate' ? 'Computing Solver...' : 'Generate Settlement Plan ⚡'}
              </button>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-xl inline-flex items-center gap-1.5 font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Only the group admin can trigger the settlement algorithm.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Algorithm Info Banner */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-800">
                  Algorithm:{' '}
                  <span className="capitalize text-olive-800">
                    {data.settlements[0]?.algorithm_used || 'Hybrid'} Solver
                  </span>
                </span>
                <span className="text-slate-400 block text-[11px]">
                  {data.settlements[0]?.algorithm_used === 'exact'
                    ? 'Guaranteed mathematical absolute minimum payments.'
                    : 'Fast greedy heuristic matching.'}
                </span>
              </div>
              <span className="font-black text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                {data.transaction_count} {data.transaction_count === 1 ? 'payment' : 'payments'}
              </span>
            </div>

            {/* Transactions List */}
            <div className="space-y-3">
              {data.settlements.map((tx) => {
                const isPayer = currentUser.username === tx.from_name;
                const isReceiver = currentUser.username === tx.to_name;

                return (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3"
                  >
                    {/* Direction & Amount */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <span className={`${isPayer ? 'text-olive-700 underline font-extrabold' : ''}`}>
                          @{tx.from_name}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className={`${isReceiver ? 'text-olive-700 underline font-extrabold' : ''}`}>
                          @{tx.to_name}
                        </span>
                      </div>
                      <span className="text-base font-black text-slate-900">₹{tx.amount.toFixed(2)}</span>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center justify-between text-xs">
                      {tx.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Confirmed Paid
                        </span>
                      ) : tx.status === 'paid_pending_confirmation' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" /> Awaiting Receiver Confirmation
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          Pending Payment
                        </span>
                      )}

                      {tx.upi_link && (
                        <button
                          type="button"
                          onClick={() => setQrModalTx(tx)}
                          className="text-[11px] font-bold text-olive-700 hover:underline flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Code</span>
                        </button>
                      )}
                    </div>

                    {/* Action Buttons for this transaction */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 justify-end text-xs">
                      {/* One-Tap UPI Link (Payer or anyone can open) */}
                      {tx.upi_link && tx.status !== 'confirmed' && (
                        <a
                          href={tx.upi_link}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Pay via UPI App</span>
                        </a>
                      )}

                      {/* Payer: Mark as Paid */}
                      {isPayer && tx.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(tx.id)}
                          disabled={actionLoading === tx.id}
                          className="px-3.5 py-1.5 bg-olive-primary hover:bg-olive-700 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                        >
                          {actionLoading === tx.id ? 'Marking...' : 'Mark as Paid'}
                        </button>
                      )}

                      {/* Receiver: Confirm or Deny */}
                      {isReceiver && tx.status === 'paid_pending_confirmation' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeny(tx.id)}
                            disabled={actionLoading === tx.id}
                            className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition"
                          >
                            Deny
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirm(tx.id)}
                            disabled={actionLoading === tx.id}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
                          >
                            Confirm Received
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Admin Cancel Settlement Section */}
            {group.is_admin && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Cancel Settlement?</span>
                  <span className="text-[11px] text-slate-400">
                    {canCancel
                      ? 'Reopens group to active state so you can add more expenses.'
                      : 'Disabled because one or more payments are already in motion or confirmed.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelSettlement}
                  disabled={!canCancel || actionLoading === 'cancel'}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Settlement'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* QR Code Modal Overlay */}
        {qrModalTx && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center space-y-4">
              <h4 className="font-bold text-slate-900 text-sm">Scan to Pay via UPI</h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    qrModalTx.upi_link
                  )}`}
                  alt="UPI QR Code"
                  className="w-44 h-44 mx-auto"
                />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Pay ₹{qrModalTx.amount.toFixed(2)} to @{qrModalTx.to_name}
              </p>
              <button
                onClick={() => setQrModalTx(null)}
                className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

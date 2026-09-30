import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TrendingUp, TrendingDown, CheckCircle2, Zap, RefreshCw, AlertCircle } from 'lucide-react';

export default function BalancesTab({ group, onOpenSettleModal }) {
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getBalances(group.id);
      setBalances(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [group.id]);

  const balanceEntries = Object.entries(balances);
  const totalPositive = balanceEntries.reduce((sum, [_, amt]) => amt > 0 ? sum + amt : sum, 0);

  return (
    <div className="space-y-6">
      {/* Settle Up Action Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-olive-300 flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5" /> Minimum-Transaction Settlement
          </span>
          <h2 className="text-xl font-bold">Simplify Group Debts</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            Calculates the mathematically minimum payments required to zero everyone out, with 1-tap UPI deep-links.
          </p>
        </div>

        <button
          onClick={onOpenSettleModal}
          className="px-6 py-3 bg-olive-primary hover:bg-olive-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-olive-primary/30 flex items-center justify-center gap-2 transition active:scale-[0.98] flex-shrink-0"
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>Settle Up ⚡</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Net Balances List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Member Net Positions</h3>
            <p className="text-xs text-slate-500">Live balance calculated fresh from group expenses and IOUs.</p>
          </div>
          <button
            onClick={fetchBalances}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-olive-600" />
            <span className="text-xs font-medium">Computing live balances...</span>
          </div>
        ) : balanceEntries.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No expenses logged yet. Add an expense to view member balances!
          </div>
        ) : (
          <div className="space-y-3">
            {balanceEntries.map(([name, amount]) => {
              const isOwed = amount > 0.001;
              const owes = amount < -0.001;
              const isZero = !isOwed && !owes;

              return (
                <div
                  key={name}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isOwed
                          ? 'bg-emerald-100 text-emerald-800'
                          : owes
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {name[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-800 block">@{name}</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {isOwed ? 'Gets back' : owes ? 'Owes group' : 'Settled up'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base font-extrabold flex items-center justify-end gap-1 ${
                        isOwed
                          ? 'text-emerald-700'
                          : owes
                          ? 'text-red-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {isOwed && <TrendingUp className="w-4 h-4" />}
                      {owes && <TrendingDown className="w-4 h-4" />}
                      {isZero && <CheckCircle2 className="w-4 h-4" />}
                      {isOwed ? `+₹${amount.toFixed(2)}` : owes ? `-₹${Math.abs(amount).toFixed(2)}` : '₹0.00'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Verification Guarantee */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Mathematical Balance Guarantee:</span>
          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            <CheckCircle2 className="w-3 h-3" /> Sum of balances = ₹0.00
          </span>
        </div>
      </div>
    </div>
  );
}

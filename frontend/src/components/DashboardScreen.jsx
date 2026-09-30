import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Plus, Users, Receipt, ArrowRight, Shield, CheckCircle2, 
  Lock, Clock, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function DashboardScreen({ user, onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [adminUpi, setAdminUpi] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.listGroups();
      setGroups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      setSubmitting(true);
      const newGroup = await api.createGroup(groupName.trim(), adminUpi.trim() || null);
      setShowCreateModal(false);
      setGroupName('');
      setAdminUpi('');
      await fetchGroups();
      if (onSelectGroup) {
        onSelectGroup(newGroup.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Your Expense Groups</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Keep shared money simple with minimum-transaction settlements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchGroups}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-olive-primary hover:bg-olive-700 text-white text-sm font-bold rounded-xl shadow-sm transition active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Group</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Groups Grid */}
      {loading && groups.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-olive-600" />
          <p className="text-sm font-medium">Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-olive-50 text-olive-primary flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No expense groups yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Create a group for your trip, apartment, or hostel mess to start tracking and simplifying shared expenses.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-olive-primary hover:bg-olive-700 text-white text-sm font-bold rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Group</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => (
            <div
              key={g.id}
              onClick={() => onSelectGroup(g.id)}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-olive-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-olive-primary text-white flex items-center justify-center font-black text-lg shadow-sm">
                      {g.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-olive-700 transition flex items-center gap-2">
                        <span>{g.name}</span>
                        {g.is_admin && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                            <Shield className="w-2.5 h-2.5" /> Admin
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Created {new Date(g.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {g.fully_settled_at ? (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Fully Settled
                    </span>
                  ) : g.is_frozen ? (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-200">
                      <Lock className="w-3 h-3" /> Settling (Frozen)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 mt-4 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {g.members_count} {g.members_count === 1 ? 'member' : 'members'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    {g.expenses_count} {g.expenses_count === 1 ? 'expense' : 'expenses'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end text-xs font-bold text-olive-primary group-hover:translate-x-0.5 transition">
                <span>Open Group</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create New Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend in Goa, Flat 402, Hostel Mess"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your UPI ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. name@okaxis, phone@upi"
                  value={adminUpi}
                  onChange={(e) => setAdminUpi(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-primary"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Used to generate 1-tap UPI payment links when group members settle debts with you.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !groupName.trim()}
                  className="px-5 py-2.5 bg-olive-primary hover:bg-olive-700 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

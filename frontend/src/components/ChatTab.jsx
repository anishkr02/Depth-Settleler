import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Send, Lock, MessageSquare, RefreshCw, AlertCircle } from 'lucide-react';

export default function ChatTab({ group, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const fetchChat = async () => {
    try {
      const data = await api.listMessages(group.id);
      setMessages(data.messages || []);
      setIsReadOnly(!!data.is_read_only);
    } catch (err) {
      // silent polling error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChat();
    // 3-second polling for active group chat
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [group.id]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || isReadOnly) return;
    try {
      setSending(true);
      setError('');
      await api.sendMessage(group.id, newMsg.trim());
      setNewMsg('');
      await fetchChat();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-olive-100 text-olive-800 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Group Coordination Chat</h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Visible to all {group.members.length} members
            </span>
          </div>
        </div>

        {isReadOnly ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-full">
            <Lock className="w-3 h-3" /> Read-Only
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            ● Active
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Message Stream */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
        {loading && messages.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-olive-600" />
            <span className="text-xs font-semibold">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium">No messages yet. Send a message to coordinate with group members!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_username === currentUser.username;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 font-semibold mb-0.5 px-1">
                  @{m.sender_username} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-medium shadow-sm ${
                    isMe
                      ? 'bg-olive-primary text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input or Closed Notice */}
      <div className="p-3 border-t border-slate-100 bg-white">
        {isReadOnly ? (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Chat is closed. All debts are settled and group is read-only.</span>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              placeholder="Type message (e.g. 'Paid on GPay, please confirm!')..."
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              disabled={sending}
              className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-olive-primary"
            />
            <button
              type="submit"
              disabled={sending || !newMsg.trim()}
              className="px-4 py-2.5 bg-olive-primary hover:bg-olive-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  PaperAirplaneIcon, ArrowLeftIcon, PhoneIcon,
  MapPinIcon, ClockIcon, GiftIcon, CheckIcon,
  UserCircleIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import directDonationService from '../../services/directDonationService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime, formatRelativeTime, initials } from '../../utils/formatters';

const STATUS_META = {
  AVAILABLE: { color: 'badge-info',    label: 'Available'  },
  ACCEPTED:  { color: 'badge-warning', label: 'Accepted'   },
  COMPLETED: { color: 'badge-success', label: 'Completed'  },
  CANCELLED: { color: 'badge-danger',  label: 'Cancelled'  },
  EXPIRED:   { color: 'badge-neutral', label: 'Expired'    },
};

export default function ChatPage() {
  const { id }           = useParams();
  const { user, primaryRole } = useAuth();
  const navigate         = useNavigate();
  const messagesEndRef   = useRef(null);
  const inputRef         = useRef(null);

  const [donation,  setDonation]  = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [text,      setText]      = useState('');
  const [sending,   setSending]   = useState(false);
  const [completing, setCompleting] = useState(false);

  const role = primaryRole?.toLowerCase().replace('_', '-');

  // ── Load donation + conversation ────────────────────────
  const load = useCallback(async () => {
    try {
      const [don, msgs] = await Promise.all([
        directDonationService.getById(id),
        directDonationService.getConversation(id),
      ]);
      setDonation(don);
      setMessages(msgs || []);
    } catch {
      toast.error('Failed to load conversation');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const msgs = await directDonationService.getConversation(id);
        setMessages(msgs || []);
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  // ── Send message ─────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await directDonationService.sendMessage(Number(id), text.trim());
      setMessages(prev => [...prev, msg]);
      setText('');
      inputRef.current?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ── Donor marks completed ────────────────────────────────
  const handleComplete = async () => {
    setCompleting(true);
    try {
      const updated = await directDonationService.complete(id);
      setDonation(updated);
      toast.success('✅ Donation marked as completed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark completed');
    } finally {
      setCompleting(false);
    }
  };

  // Determine the "other party" in the conversation
  const isDonor      = donation?.donorId === user?.id;
  const otherParty   = isDonor
    ? { name: donation?.receiverName, id: donation?.receiverId }
    : { name: donation?.donorName,    id: donation?.donorId    };

  if (loading) return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div className="skeleton h-24 rounded-2xl" />
      <div className="skeleton flex-1 rounded-2xl" />
      <div className="skeleton h-14 rounded-2xl" />
    </div>
  );

  const statusMeta = STATUS_META[donation?.status] || STATUS_META.AVAILABLE;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div className="card p-4 mb-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="btn-icon shrink-0">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        {/* Other party avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {initials(otherParty?.name || '?')}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
            {otherParty?.name || 'Unknown'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{donation?.title}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`badge ${statusMeta.color}`}>{statusMeta.label}</span>

          {/* Donor can mark as completed when ACCEPTED */}
          {isDonor && donation?.status === 'ACCEPTED' && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
            >
              {completing
                ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <CheckCircleIcon className="w-3.5 h-3.5" />}
              Mark Done
            </button>
          )}
        </div>
      </div>

      {/* ── DONATION INFO BANNER ─────────────────────────────── */}
      <div className="card p-3 mb-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <GiftIcon className="w-3.5 h-3.5 text-primary-400" />
            {donation?.quantity} {donation?.quantityUnit?.toLowerCase()}
          </span>
          <span className="flex items-center gap-1">
            <MapPinIcon className="w-3.5 h-3.5 text-slate-400" />
            {donation?.pickupCity}
          </span>
          {donation?.preferredTime && (
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
              {donation.preferredTime}
            </span>
          )}
          {donation?.contactPhone && (
            <span className="flex items-center gap-1 font-medium text-primary-600 dark:text-primary-400">
              <PhoneIcon className="w-3.5 h-3.5" />
              {donation.contactPhone}
            </span>
          )}
          <span className="text-xs text-slate-400">{donation?.pickupAddress}</span>
        </div>
      </div>

      {/* ── MESSAGES ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto card p-4 space-y-3 mb-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-3">
              <PaperAirplaneIcon className="w-7 h-7 text-primary-300 dark:text-primary-600" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium text-sm">Start the conversation</p>
            <p className="text-slate-400 text-xs mt-1">
              {isDonor
                ? 'Message the receiver to coordinate the food handover.'
                : 'Message the donor to arrange pickup details.'}
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isMine     = msg.isMine;
              const showAvatar = !isMine && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Other party avatar */}
                  {!isMine && (
                    <div className={`w-7 h-7 rounded-full shrink-0 bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center text-xs font-bold ${showAvatar ? 'visible' : 'invisible'}`}>
                      {initials(msg.senderName)}
                    </div>
                  )}

                  <div className={`max-w-[72%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {showAvatar && !isMine && (
                      <p className="text-xs text-slate-400 ml-1">{msg.senderName}</p>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.message}
                    </div>
                    <p className={`text-xs text-slate-400 dark:text-slate-500 ${isMine ? 'text-right' : 'text-left'} px-1`}>
                      {formatRelativeTime(msg.createdAt)}
                      {isMine && msg.isRead && (
                        <span className="ml-1 text-primary-400">
                          <CheckIcon className="w-3 h-3 inline" />
                          <CheckIcon className="w-3 h-3 inline -ml-1" />
                        </span>
                      )}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── MESSAGE INPUT ────────────────────────────────────── */}
      {donation?.status === 'CANCELLED' || donation?.status === 'EXPIRED' ? (
        <div className="card p-3 text-center text-sm text-slate-400 shrink-0">
          This donation is {donation.status.toLowerCase()} — messaging is disabled.
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex items-end gap-2 shrink-0">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            placeholder="Type a message… (Enter to send)"
            className="input-field flex-1 resize-none max-h-32 py-3"
            style={{ overflowY: text.split('\n').length > 3 ? 'auto' : 'hidden' }}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="btn-primary !p-3 !rounded-xl shrink-0 disabled:opacity-40"
          >
            {sending
              ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <PaperAirplaneIcon className="w-5 h-5" />}
          </button>
        </form>
      )}
    </div>
  );
}
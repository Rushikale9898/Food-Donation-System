import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  GiftIcon, MapPinIcon, PhoneIcon, ClockIcon,
  ChatBubbleLeftRightIcon, ArrowPathIcon, EyeIcon,
  CheckCircleIcon, CheckBadgeIcon, XCircleIcon,
  CalendarIcon, UserCircleIcon,
} from '@heroicons/react/24/outline';
import directDonationService from '../../services/directDonationService';
import { formatDateTime, formatRelativeTime, initials } from '../../utils/formatters';
 
const STATUS_TABS = ['ALL', 'ACCEPTED', 'COMPLETED', 'CANCELLED', 'EXPIRED'];
 
const STATUS_META = {
  AVAILABLE: { color: 'badge-info',    label: 'Available',  icon: GiftIcon,         dot: 'bg-blue-400'    },
  ACCEPTED:  { color: 'badge-warning', label: 'Accepted',   icon: CheckCircleIcon,  dot: 'bg-amber-400'   },
  COMPLETED: { color: 'badge-success', label: 'Completed',  icon: CheckBadgeIcon,   dot: 'bg-emerald-400' },
  CANCELLED: { color: 'badge-danger',  label: 'Cancelled',  icon: XCircleIcon,      dot: 'bg-red-400'     },
  EXPIRED:   { color: 'badge-neutral', label: 'Expired',    icon: XCircleIcon,      dot: 'bg-slate-400'   },
};
 
const FOOD_TYPE_COLORS = {
  VEG:     'badge-success',
  NON_VEG: 'badge-danger',
  VEGAN:   'badge-info',
  MIXED:   'badge-neutral',
};
 
export default function MyReceivedPage() {
  const [donations, setDonations]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [page, setPage]                   = useState(0);
  const [totalPages, setTotalPages]       = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchParams]                    = useSearchParams();
  const [activeTab, setActiveTab]         = useState(
    searchParams.get('status')?.toUpperCase() || 'ALL'
  );
 
  const navigate = useNavigate();
 
  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await directDonationService.getMyReceived({
        status: activeTab === 'ALL' ? undefined : activeTab,
        page,
        size: 10,
      });
      setDonations(result.content || []);
      setTotalPages(result.totalPages   || 0);
      setTotalElements(result.totalElements || 0);
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);
 
  useEffect(() => { fetchDonations(); }, [fetchDonations]);
  useEffect(() => { setPage(0); }, [activeTab]);
 
  // Summary counts from current page (approximate)
  const acceptedCount  = donations.filter(d => d.status === 'ACCEPTED').length;
  const completedCount = donations.filter(d => d.status === 'COMPLETED').length;
 
  return (
    <div className="space-y-6 animate-fade-in">
 
      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-sm">
              <GiftIcon className="w-5 h-5 text-white" />
            </span>
            My Received Donations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {totalElements > 0
              ? `${totalElements} donation${totalElements !== 1 ? 's' : ''} total`
              : 'No donations yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/receiver/browse')}
            className="btn-primary text-sm"
          >
            <GiftIcon className="w-4 h-4" /> Browse Donations
          </button>
          <button onClick={fetchDonations} className="btn-icon" title="Refresh">
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
 
      {/* ── STATUS TABS ────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => {
          const meta = STATUS_META[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary-300'
              }`}
            >
              {meta && (
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              )}
              {tab}
            </button>
          );
        })}
      </div>
 
      {/* ── LIST ───────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 flex gap-4">
              <div className="skeleton w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
            <GiftIcon className="w-8 h-8 text-primary-300 dark:text-primary-600" />
          </div>
          <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
            {activeTab === 'ALL'
              ? "You haven't accepted any donations yet"
              : `No ${activeTab.toLowerCase()} donations`}
          </h3>
          <p className="text-slate-400 text-sm mb-5">
            {activeTab === 'ALL'
              ? 'Browse available donations and accept the ones you need.'
              : `Switch to another tab or browse for new donations.`}
          </p>
          <button
            onClick={() => navigate('/receiver/browse')}
            className="btn-primary text-sm"
          >
            <GiftIcon className="w-4 h-4" /> Browse Available Donations
          </button>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {donations.map((d, i) => {
              const meta      = STATUS_META[d.status] || STATUS_META.ACCEPTED;
              const StatusIcon = meta.icon;
              const isAccepted  = d.status === 'ACCEPTED';
              const isCompleted = d.status === 'COMPLETED';
 
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`card p-5 transition-all duration-200 ${
                    isAccepted ? 'border-l-4 border-l-amber-400' :
                    isCompleted ? 'border-l-4 border-l-emerald-400' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
 
                    {/* Left — donation info */}
                    <div className="flex gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isAccepted  ? 'bg-amber-50 dark:bg-amber-900/20'   :
                        isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                                      'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        <GiftIcon className={`w-6 h-6 ${
                          isAccepted  ? 'text-amber-500'   :
                          isCompleted ? 'text-emerald-500' :
                                        'text-slate-400'
                        }`} />
                      </div>
 
                      <div className="min-w-0 flex-1">
                        {/* Title + badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                            {d.title}
                          </h3>
                          <span className={`badge ${meta.color} flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          {d.foodType && (
                            <span className={`badge ${FOOD_TYPE_COLORS[d.foodType] || 'badge-neutral'}`}>
                              {d.foodType.replace('_', ' ')}
                            </span>
                          )}
                          {d.unreadMessages > 0 && (
                            <span className="badge badge-purple flex items-center gap-1">
                              <ChatBubbleLeftRightIcon className="w-3 h-3" />
                              {d.unreadMessages} new
                            </span>
                          )}
                        </div>
 
                        {/* Description */}
                        {d.description && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mb-1.5">
                            {d.description}
                          </p>
                        )}
 
                        {/* Details row */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <GiftIcon className="w-3.5 h-3.5" />
                            {d.quantity} {d.quantityUnit?.toLowerCase()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="w-3.5 h-3.5" />
                            {d.pickupCity}
                          </span>
                          {d.preferredTime && (
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-3.5 h-3.5" />
                              {d.preferredTime}
                            </span>
                          )}
                          {/* Show contact phone only for accepted/completed */}
                          {(isAccepted || isCompleted) && d.contactPhone && (
                            <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
                              <PhoneIcon className="w-3.5 h-3.5" />
                              {d.contactPhone}
                            </span>
                          )}
                        </div>
 
                        {/* Donor info */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                            {d.donorProfileImage
                              ? <img src={d.donorProfileImage} alt="" className="w-full h-full object-cover" />
                              : initials(d.donorName)?.charAt(0)}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            From: <span className="font-medium text-slate-700 dark:text-slate-300">{d.donorName}</span>
                            {' · '}
                            {formatRelativeTime(d.createdAt)}
                          </p>
                        </div>
 
                        {/* Receiver note */}
                        {d.receiverNote && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">
                            Your note: "{d.receiverNote}"
                          </p>
                        )}
 
                        {/* Pickup address */}
                        {(isAccepted || isCompleted) && d.pickupAddress && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-start gap-1">
                            <MapPinIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            {d.pickupAddress}
                          </p>
                        )}
 
                        {/* Completed timestamp */}
                        {isCompleted && d.completedAt && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 font-medium">
                            <CheckBadgeIcon className="w-3.5 h-3.5" />
                            Completed on {formatDateTime(d.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>
 
                    {/* Right — action buttons */}
                    <div className="flex flex-wrap gap-2 shrink-0">
 
                      {/* View Details */}
                      <button
                        onClick={() => navigate(`/receiver/donations/${d.id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="View full details"
                      >
                        <EyeIcon className="w-4 h-4" /> Details
                      </button>
 
                      {/* Chat — only when ACCEPTED */}
                      {isAccepted && (
                        <button
                          onClick={() => navigate(`/receiver/donations/${d.id}/chat`)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-100 transition-colors relative"
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          Chat
                          {d.unreadMessages > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                              {d.unreadMessages}
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
 
      {/* ── PAGINATION ──────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400 px-3">
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
 
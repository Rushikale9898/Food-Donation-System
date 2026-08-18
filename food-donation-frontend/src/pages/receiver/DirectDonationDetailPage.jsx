import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon, GiftIcon, MapPinIcon, PhoneIcon,
  ClockIcon, UserCircleIcon, CheckCircleIcon,
  ChatBubbleLeftRightIcon, CalendarIcon,
  CheckBadgeIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import directDonationService from '../../services/directDonationService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime, formatRelativeTime, initials } from '../../utils/formatters';
 
const STATUS_META = {
  AVAILABLE: { color: 'badge-info',    label: 'Available',  icon: GiftIcon         },
  ACCEPTED:  { color: 'badge-warning', label: 'Accepted',   icon: CheckCircleIcon  },
  COMPLETED: { color: 'badge-success', label: 'Completed',  icon: CheckBadgeIcon   },
  CANCELLED: { color: 'badge-danger',  label: 'Cancelled',  icon: XCircleIcon      },
  EXPIRED:   { color: 'badge-neutral', label: 'Expired',    icon: XCircleIcon      },
};
 
const FOOD_TYPE_COLORS = {
  VEG:     'badge-success',
  NON_VEG: 'badge-danger',
  VEGAN:   'badge-info',
  MIXED:   'badge-neutral',
};
 
export default function DirectDonationDetailPage() {
  const { id }               = useParams();
  const navigate             = useNavigate();
  const { user, primaryRole } = useAuth();
 
  const [donation,  setDonation]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [acceptNote, setAcceptNote] = useState('');
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
 
  const role       = primaryRole?.toLowerCase().replace('_', '-');
  const isDonor    = donation?.donorId === user?.id;
  const isReceiver = donation?.receiverId === user?.id;
  const isAvailable = donation?.status === 'AVAILABLE';
  const isAccepted  = donation?.status === 'ACCEPTED';
 
  useEffect(() => {
    directDonationService.getById(id)
      .then(setDonation)
      .catch(() => {
        toast.error('Donation not found');
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [id]);
 
  const handleAccept = async () => {
    setAccepting(true);
    try {
      await directDonationService.accept(Number(id), acceptNote);
      toast.success('🎉 Donation accepted! Check your notifications for donor contact.');
      navigate('/receiver/my-received');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept donation');
    } finally {
      setAccepting(false);
    }
  };
 
  const handleComplete = async () => {
    setCompleting(true);
    try {
      const updated = await directDonationService.complete(id);
      setDonation(updated);
      toast.success('✅ Marked as completed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setCompleting(false);
    }
  };
 
  const handleCancel = async () => {
    if (!window.confirm('Cancel this donation?')) return;
    setCancelling(true);
    try {
      await directDonationService.cancel(id, 'Cancelled by donor');
      toast.success('Donation cancelled');
      navigate('/donor/direct-donations');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setCancelling(false);
    }
  };
 
  if (loading) return (
    <div className="max-w-2xl space-y-4">
      <div className="skeleton h-10 w-32 rounded-xl" />
      <div className="skeleton h-64 rounded-2xl" />
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  );
 
  if (!donation) return null;
 
  const meta     = STATUS_META[donation.status] || STATUS_META.AVAILABLE;
  const StatusIcon = meta.icon;
  const chatPath = isDonor
    ? `/donor/direct-donations/${id}/chat`
    : `/receiver/donations/${id}/chat`;
 
  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
 
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="btn-ghost !px-0 text-sm">
        <ArrowLeftIcon className="w-4 h-4" /> Back
      </button>
 
      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        {/* Color bar */}
        <div className="h-2 bg-gradient-to-r from-primary-500 to-accent-500" />
 
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`badge ${FOOD_TYPE_COLORS[donation.foodType] || 'badge-neutral'}`}>
                  {donation.foodType?.replace('_', ' ')}
                </span>
                <span className={`badge ${meta.color} flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {meta.label}
                </span>
              </div>
              <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {donation.title}
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Posted {formatRelativeTime(donation.createdAt)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
              <GiftIcon className="w-6 h-6 text-primary-500" />
            </div>
          </div>
 
          {/* Description */}
          {donation.description && (
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              {donation.description}
            </p>
          )}
 
          {/* Details grid */}
          <div className="grid sm:grid-cols-2 gap-3 mb-5">
            <DetailItem icon={GiftIcon} label="Quantity"
              value={`${donation.quantity} ${donation.quantityUnit?.toLowerCase()}`} />
            <DetailItem icon={MapPinIcon} label="Pickup City"
              value={donation.pickupCity} />
            <DetailItem icon={MapPinIcon} label="Pickup Address"
              value={donation.pickupAddress} />
            {donation.preferredTime && (
              <DetailItem icon={ClockIcon} label="Preferred Pickup Time"
                value={donation.preferredTime} />
            )}
            {donation.expiresAt && (
              <DetailItem icon={CalendarIcon} label="Expires At"
                value={formatDateTime(donation.expiresAt)} />
            )}
            {/* Show contact phone only after acceptance */}
            {(isReceiver || isDonor) && (
              <DetailItem icon={PhoneIcon} label="Contact Phone"
                value={donation.contactPhone}
                highlight />
            )}
          </div>
 
          {/* Receiver note */}
          {donation.receiverNote && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 mb-4">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Receiver's Note</p>
              <p className="text-sm text-amber-800 dark:text-amber-300">{donation.receiverNote}</p>
            </div>
          )}
 
          {/* Completion info */}
          {donation.completedAt && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 mb-4">
              <CheckBadgeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Completed</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">{formatDateTime(donation.completedAt)}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
 
      {/* Donor info card */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
          Donor
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
            {donation.donorProfileImage
              ? <img src={donation.donorProfileImage} alt="" className="w-full h-full object-cover" />
              : initials(donation.donorName)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{donation.donorName}</p>
            <p className="text-xs text-slate-400">{donation.donorCity}</p>
            {/* Show phone only to accepted receiver or to donor themselves */}
            {(isReceiver || isDonor) && donation.contactPhone && (
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1 mt-0.5">
                <PhoneIcon className="w-3 h-3" />
                {donation.contactPhone}
              </p>
            )}
          </div>
        </div>
      </div>
 
      {/* Receiver info card — shown only after accepted */}
      {donation.receiverName && (
        <div className="card p-5">
          <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
            Receiver
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-sm">
              {initials(donation.receiverName)}
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{donation.receiverName}</p>
              {donation.receiverNote && (
                <p className="text-xs text-slate-400 mt-0.5">"{donation.receiverNote}"</p>
              )}
            </div>
          </div>
        </div>
      )}
 
      {/* ── ACTION BUTTONS ──────────────────────────────────── */}
 
      {/* RECEIVER: Accept button — shown when AVAILABLE and not the donor */}
      {!isDonor && !isReceiver && isAvailable && (
        <div className="card p-5 space-y-3">
          <h3 className="font-display font-semibold text-slate-900 dark:text-white">
            Accept This Donation
          </h3>
 
          {/* Contact preview */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
            <PhoneIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
            <p className="text-xs text-primary-700 dark:text-primary-400">
              After accepting, the donor's contact phone <strong>{donation.contactPhone}</strong> will be shared with you to arrange pickup.
            </p>
          </div>
 
          <div>
            <label className="label-field">Add a note (optional)</label>
            <textarea
              rows={2}
              className="input-field"
              placeholder="e.g. I'll pick it up between 3–5 PM..."
              value={acceptNote}
              onChange={e => setAcceptNote(e.target.value)}
            />
          </div>
 
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="btn-primary w-full justify-center !py-3"
          >
            {accepting
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Accepting…</>
              : <><CheckCircleIcon className="w-4 h-4" /> Accept Donation</>}
          </button>
        </div>
      )}
 
      {/* CHAT button — shown to both donor and accepted receiver */}
      {(isDonor || isReceiver) && isAccepted && (
        <button
          onClick={() => navigate(chatPath)}
          className="btn-primary w-full justify-center !py-3"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          Open Chat with {isDonor ? 'Receiver' : 'Donor'}
          {donation.unreadMessages > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
              {donation.unreadMessages} new
            </span>
          )}
        </button>
      )}
 
      {/* DONOR actions */}
      {isDonor && (
        <div className="flex gap-3">
          {isAccepted && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors"
            >
              {completing
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <CheckBadgeIcon className="w-4 h-4" />}
              Mark as Completed
            </button>
          )}
          {(isAvailable || isAccepted) && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 font-semibold text-sm border border-danger-200 dark:border-danger-800 hover:bg-danger-100 transition-colors"
            >
              {cancelling
                ? <span className="w-4 h-4 border-2 border-danger-300 border-t-danger-600 rounded-full animate-spin" />
                : <XCircleIcon className="w-4 h-4" />}
              Cancel Donation
            </button>
          )}
        </div>
      )}
    </div>
  );
}
 
function DetailItem({ icon: Icon, label, value, highlight }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        <p className={`text-sm font-medium mt-0.5 ${highlight ? 'text-primary-600 dark:text-primary-400' : 'text-slate-800 dark:text-slate-100'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
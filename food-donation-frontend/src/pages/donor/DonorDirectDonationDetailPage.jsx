import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon, GiftIcon, MapPinIcon, PhoneIcon,
  ClockIcon, CheckCircleIcon, CheckBadgeIcon,
  XCircleIcon, ChatBubbleLeftRightIcon, CalendarIcon,
  ShieldCheckIcon, InformationCircleIcon, EnvelopeIcon,
  HomeIcon, UserGroupIcon, HeartIcon,
  ExclamationTriangleIcon, DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import directDonationService from '../../services/directDonationService';
import { formatDateTime, formatRelativeTime, initials } from '../../utils/formatters';
 
const STATUS_META = {
  AVAILABLE: { color: 'badge-info',    label: 'Available',  icon: GiftIcon,        bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-700 dark:text-blue-300'       },
  ACCEPTED:  { color: 'badge-warning', label: 'Accepted',   icon: CheckCircleIcon, bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-300'     },
  COMPLETED: { color: 'badge-success', label: 'Completed',  icon: CheckBadgeIcon,  bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
  CANCELLED: { color: 'badge-danger',  label: 'Cancelled',  icon: XCircleIcon,     bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-700 dark:text-red-300'         },
  EXPIRED:   { color: 'badge-neutral', label: 'Expired',    icon: XCircleIcon,     bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-600 dark:text-slate-400'     },
};
 
const FOOD_TYPE_COLORS = {
  VEG:     'badge-success',
  NON_VEG: 'badge-danger',
  VEGAN:   'badge-info',
  MIXED:   'badge-neutral',
};
 
const RECEIVER_TYPE_LABELS = {
  INDIVIDUAL:   'Individual',
  FAMILY:       'Family',
  ORPHANAGE:    'Orphanage',
  OLD_AGE_HOME: 'Old Age Home',
  SHELTER:      'Shelter Home',
  OTHER:        'Other',
};
 
export default function DonorDirectDonationDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
 
  const [donation,        setDonation]        = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [completing,      setCompleting]      = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason,    setCancelReason]    = useState('');
  const [cancelling,      setCancelling]      = useState(false);
 
  useEffect(() => {
    directDonationService.getById(id)
      .then(setDonation)
      .catch(() => {
        toast.error('Donation not found');
        navigate('/donor/direct-donations');
      })
      .finally(() => setLoading(false));
  }, [id]);
 
  const handleComplete = async () => {
    setCompleting(true);
    try {
      const updated = await directDonationService.complete(id);
      setDonation(updated);
      toast.success('✅ Donation marked as completed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setCompleting(false); }
  };
 
  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a reason'); return; }
    setCancelling(true);
    try {
      await directDonationService.cancel(id, cancelReason.trim());
      toast.success('Donation cancelled');
      navigate('/donor/direct-donations');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setCancelling(false); setShowCancelModal(false); }
  };
 
  if (loading) return (
    <div className="max-w-2xl space-y-4">
      <div className="skeleton h-10 w-28 rounded-xl" />
      <div className="skeleton h-72 rounded-2xl" />
      <div className="skeleton h-56 rounded-2xl" />
    </div>
  );
 
  if (!donation) return null;
 
  const meta        = STATUS_META[donation.status] || STATUS_META.AVAILABLE;
  const StatusIcon  = meta.icon;
  const isAvailable = donation.status === 'AVAILABLE';
  const isAccepted  = donation.status === 'ACCEPTED';
  const isCompleted = donation.status === 'COMPLETED';
 
  // Get foodType string safely (enum or string from backend)
  const foodTypeStr = typeof donation.foodType === 'object'
    ? donation.foodType?.name : donation.foodType;
  const quantityUnitStr = typeof donation.quantityUnit === 'object'
    ? donation.quantityUnit?.name : donation.quantityUnit;
 
  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
 
      {/* Back */}
      <button onClick={() => navigate('/donor/direct-donations')}
        className="btn-ghost !px-0 text-sm">
        <ArrowLeftIcon className="w-4 h-4" /> Back to My Direct Donations
      </button>
 
      {/* ── DONATION CARD ──────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary-500 to-accent-500" />
        <div className="p-6">
 
          {/* Status banner */}
          <div className={`flex items-start gap-3 p-3 rounded-xl ${meta.bg} mb-5`}>
            <StatusIcon className={`w-5 h-5 shrink-0 mt-0.5 ${meta.text}`} />
            <div>
              <p className={`text-sm font-semibold ${meta.text}`}>
                {isAvailable && 'Waiting for a receiver to accept your donation'}
                {isAccepted  && `${donation.receiverName} has accepted your donation!`}
                {isCompleted && 'Donation successfully completed ✅'}
                {donation.status === 'CANCELLED' && 'This donation was cancelled'}
                {donation.status === 'EXPIRED'   && 'This donation has expired'}
              </p>
              {isAccepted && (
                <p className={`text-xs mt-0.5 ${meta.text} opacity-80`}>
                  Call the receiver or use chat below to coordinate the food handover.
                </p>
              )}
            </div>
          </div>
 
          {/* Title + badges */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
              <GiftIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-1">
                <span className={`badge ${FOOD_TYPE_COLORS[foodTypeStr] || 'badge-neutral'}`}>
                  {foodTypeStr?.replace('_', ' ')}
                </span>
                <span className={`badge ${meta.color}`}>{meta.label}</span>
              </div>
              <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {donation.title}
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Posted {formatRelativeTime(donation.createdAt)}
              </p>
            </div>
          </div>
 
          {/* Description */}
          {donation.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              {donation.description}
            </p>
          )}
 
          {/* Info grid */}
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoRow icon={GiftIcon}      label="Quantity"
              value={`${donation.quantity} ${quantityUnitStr?.toLowerCase()}`} />
            <InfoRow icon={MapPinIcon}    label="City"           value={donation.pickupCity} />
            <InfoRow icon={MapPinIcon}    label="Pickup Address" value={donation.pickupAddress} />
            <InfoRow icon={PhoneIcon}     label="Your Contact"   value={donation.contactPhone} highlight />
            {donation.preferredTime && (
              <InfoRow icon={ClockIcon}   label="Preferred Time" value={donation.preferredTime} />
            )}
            {donation.expiresAt && (
              <InfoRow icon={CalendarIcon} label="Expires At"    value={formatDateTime(donation.expiresAt)} />
            )}
            {isCompleted && donation.completedAt && (
              <InfoRow icon={CheckBadgeIcon} label="Completed At"
                value={formatDateTime(donation.completedAt)} highlight />
            )}
          </div>
 
          {donation.cancelledReason && (
            <div className="mt-4 p-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-100 dark:border-danger-800">
              <p className="text-xs font-semibold text-danger-700 dark:text-danger-400 mb-0.5">Cancellation Reason</p>
              <p className="text-sm text-danger-600 dark:text-danger-300">{donation.cancelledReason}</p>
            </div>
          )}
        </div>
      </motion.div>
 
      {/* ── RECEIVER CONTACT CARD ─────────────────────────── */}
      {isAvailable && (
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <UserGroupIcon className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">No receiver yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Once a receiver accepts, their full contact details and phone number will appear here.
            </p>
          </div>
        </div>
      )}
 
      {(isAccepted || isCompleted) && donation.receiverName && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card overflow-hidden"
        >
          {/* Green header */}
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-white" />
              <h3 className="font-display font-semibold text-white">Receiver Details</h3>
            </div>
            {donation.receiverVerified && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20">
                <ShieldCheckIcon className="w-3.5 h-3.5 text-white" />
                <span className="text-xs text-white font-medium">Verified</span>
              </div>
            )}
          </div>
 
          <div className="p-6 space-y-4">
 
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-md overflow-hidden shrink-0">
                {donation.receiverProfileImage
                  ? <img src={donation.receiverProfileImage} alt="" className="w-full h-full object-cover" />
                  : initials(donation.receiverName)}
              </div>
              <div>
                <p className="font-display font-bold text-slate-900 dark:text-white text-lg">
                  {donation.receiverName}
                </p>
                {donation.receiverType && (
                  <span className="badge badge-success mt-1">
                    {RECEIVER_TYPE_LABELS[donation.receiverType] || donation.receiverType}
                  </span>
                )}
              </div>
            </div>
 
            {/* ── PROMINENT CALL TO ACTION ──────────────────── */}
            {donation.receiverPhone && isAccepted && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                <p className="text-xs text-white/70 font-medium uppercase tracking-wide mb-1">
                  Call Receiver to Arrange Pickup
                </p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <DevicePhoneMobileIcon className="w-5 h-5 text-white/80" />
                    <span className="font-display text-2xl font-bold tracking-wide">
                      {donation.receiverPhone}
                    </span>
                  </div>
                  <a
                    href={`tel:${donation.receiverPhone}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-primary-600 font-bold text-sm hover:bg-primary-50 transition-colors shadow-sm shrink-0"
                  >
                    <PhoneIcon className="w-4 h-4" />
                    Call Now
                  </a>
                </div>
                {donation.receiverCity && (
                  <p className="text-xs text-white/60 mt-2 flex items-center gap-1">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    {donation.receiverCity}
                    {donation.receiverAddress ? ` · ${donation.receiverAddress}` : ''}
                  </p>
                )}
              </div>
            )}
 
            {/* Contact details grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {donation.receiverPhone && (
                <ContactItem icon={PhoneIcon}    label="Phone Number"
                  value={donation.receiverPhone}   highlight
                  action={`tel:${donation.receiverPhone}`}    actionLabel="Call" />
              )}
              {donation.receiverEmail && (
                <ContactItem icon={EnvelopeIcon} label="Email Address"
                  value={donation.receiverEmail}   highlight
                  action={`mailto:${donation.receiverEmail}`} actionLabel="Email" />
              )}
              {donation.receiverCity && (
                <ContactItem icon={MapPinIcon}   label="City"    value={donation.receiverCity} />
              )}
              {donation.receiverAddress && (
                <ContactItem icon={HomeIcon}     label="Address" value={donation.receiverAddress} />
              )}
            </div>
 
            {/* Food requirements */}
            {(donation.receiverFamilySize || donation.receiverSpecialNeeds) && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Food Requirements
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {donation.receiverFamilySize && (
                    <ContactItem icon={UserGroupIcon} label="Family / Group Size"
                      value={`${donation.receiverFamilySize} ${donation.receiverFamilySize === 1 ? 'person' : 'people'}`} />
                  )}
                  {donation.receiverSpecialNeeds && (
                    <ContactItem icon={HeartIcon}     label="Dietary / Special Needs"
                      value={donation.receiverSpecialNeeds} warning />
                  )}
                </div>
              </div>
            )}
 
            {/* Receiver's note */}
            {donation.receiverNote && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                  Message from {donation.receiverName?.split(' ')[0]}
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-300 italic">
                  "{donation.receiverNote}"
                </p>
              </div>
            )}
 
            {/* Accepted timestamp */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <CalendarIcon className="w-4 h-4 shrink-0" />
              <span>Accepted {formatRelativeTime(donation.updatedAt)}</span>
            </div>
          </div>
        </motion.div>
      )}
 
      {/* ── COMPLETED: show receiver phone even after completion ── */}
      {isCompleted && donation.receiverPhone && (
        <div className="card p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PhoneIcon className="w-5 h-5 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Receiver's Phone</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{donation.receiverPhone}</p>
            </div>
          </div>
          <a href={`tel:${donation.receiverPhone}`}
            className="btn-secondary text-xs !py-2 !px-3">
            <PhoneIcon className="w-3.5 h-3.5" /> Call
          </a>
        </div>
      )}
 
      {/* ── ACTION BUTTONS ───────────────────────────────── */}
 
      {/* Chat — ACCEPTED */}
      {isAccepted && (
        <button
          onClick={() => navigate(`/donor/direct-donations/${id}/chat`)}
          className="btn-primary w-full justify-center !py-3 text-base"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          Chat with {donation.receiverName?.split(' ')[0] || 'Receiver'}
          {donation.unreadMessages > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
              {donation.unreadMessages} new
            </span>
          )}
        </button>
      )}
 
      {/* Mark Completed */}
      {isAccepted && (
        <button onClick={handleComplete} disabled={completing}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors shadow-md">
          {completing
            ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <CheckBadgeIcon className="w-5 h-5" />}
          Mark as Completed (Food Handed Over)
        </button>
      )}
 
      {/* Cancel */}
      {(isAvailable || isAccepted) && (
        <button onClick={() => setShowCancelModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 font-semibold text-sm border border-danger-200 dark:border-danger-800 hover:bg-danger-100 transition-colors">
          <XCircleIcon className="w-5 h-5" /> Cancel This Donation
        </button>
      )}
 
      {/* Completed banner */}
      {isCompleted && (
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <CheckBadgeIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Donation Completed!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
              Thank you for helping {donation.receiverName}!
            </p>
          </div>
        </div>
      )}
 
      {/* ── CANCEL MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-slate-100 dark:border-slate-800 p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                  <XCircleIcon className="w-5 h-5 text-danger-600 dark:text-danger-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-slate-900 dark:text-white">Cancel Donation</h3>
                  <p className="text-xs text-slate-400">
                    {isAccepted ? `${donation.receiverName} will be notified.` : 'Donation will be removed from listings.'}
                  </p>
                </div>
              </div>
 
              {isAccepted && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 mb-4">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>{donation.receiverName}</strong> has already accepted this. Cancelling will notify them immediately.
                  </p>
                </div>
              )}
 
              <div className="mb-5">
                <label className="label-field">Reason for Cancellation *</label>
                <textarea rows={3} className="input-field"
                  placeholder="e.g. Food has already been distributed…"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)} />
              </div>
 
              <div className="flex gap-3">
                <button onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                  className="btn-secondary flex-1 justify-center">Keep Donation</button>
                <button onClick={handleCancel}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-danger-500 hover:bg-danger-600 text-white font-semibold text-sm transition-colors disabled:opacity-40">
                  {cancelling
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <XCircleIcon className="w-4 h-4" />}
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
 
function InfoRow({ icon: Icon, label, value, highlight }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        <p className={`text-sm font-medium mt-0.5 break-words ${
          highlight ? 'text-primary-600 dark:text-primary-400' : 'text-slate-800 dark:text-slate-100'
        }`}>{value}</p>
      </div>
    </div>
  );
}
 
function ContactItem({ icon: Icon, label, value, highlight, warning, action, actionLabel }) {
  if (!value) return null;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${
      warning   ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'
      : highlight ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800'
      :             'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        warning   ? 'bg-amber-100 dark:bg-amber-900/40'
        : highlight ? 'bg-primary-100 dark:bg-primary-900/40'
        :             'bg-slate-100 dark:bg-slate-700'
      }`}>
        <Icon className={`w-4 h-4 ${
          warning   ? 'text-amber-600 dark:text-amber-400'
          : highlight ? 'text-primary-600 dark:text-primary-400'
          :             'text-slate-500'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 break-words ${
          warning   ? 'text-amber-800 dark:text-amber-300'
          : highlight ? 'text-primary-700 dark:text-primary-300'
          :             'text-slate-800 dark:text-slate-100'
        }`}>{value}</p>
        {action && (
          <a href={action}
            className="text-xs text-primary-600 dark:text-primary-400 font-semibold hover:underline mt-1 inline-block">
            {actionLabel} →
          </a>
        )}
      </div>
    </div>
  );
}
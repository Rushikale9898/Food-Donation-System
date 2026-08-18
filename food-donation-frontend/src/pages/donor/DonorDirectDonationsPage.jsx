import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  PlusIcon, GiftIcon, PencilIcon,
  ChatBubbleLeftRightIcon, CheckCircleIcon,
  MapPinIcon, PhoneIcon, ClockIcon, XMarkIcon,
  ArrowPathIcon, CheckBadgeIcon, EyeIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import directDonationService from '../../services/directDonationService';
import { formatRelativeTime } from '../../utils/formatters';

const STATUS_TABS = ['ALL', 'AVAILABLE', 'ACCEPTED', 'COMPLETED', 'CANCELLED'];

const STATUS_META = {
  AVAILABLE: { color: 'badge-info',    label: 'Available',  dot: 'bg-blue-400'    },
  ACCEPTED:  { color: 'badge-warning', label: 'Accepted',   dot: 'bg-amber-400'   },
  COMPLETED: { color: 'badge-success', label: 'Completed',  dot: 'bg-emerald-400' },
  CANCELLED: { color: 'badge-danger',  label: 'Cancelled',  dot: 'bg-red-400'     },
  EXPIRED:   { color: 'badge-neutral', label: 'Expired',    dot: 'bg-slate-400'   },
};

const FOOD_TYPE_COLORS = {
  VEG:     'badge-success',
  NON_VEG: 'badge-danger',
  VEGAN:   'badge-info',
  MIXED:   'badge-neutral',
};

// ── Create / Edit Form Modal ──────────────────────────────
function DonationFormModal({ editData, onClose, onSaved }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: editData || { foodType: 'VEG', quantityUnit: 'SERVINGS' },
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editData?.id) {
        await directDonationService.update(editData.id, data);
        toast.success('Donation updated!');
      } else {
        await directDonationService.create(data);
        toast.success('Direct donation posted! Receivers can now see it.');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-slate-100 dark:border-slate-800 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-slate-900 dark:text-white text-lg">
            {editData?.id ? 'Edit Donation' : 'Post a Direct Donation'}
          </h3>
          <button onClick={onClose} className="btn-icon !w-8 !h-8">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="label-field">Food Title *</label>
            <input className={`input-field ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g. 2 boxes of fresh biryani"
              {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'Min 3 characters' } })} />
            {errors.title && <p className="error-text">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label-field">Description</label>
            <textarea rows={2} className="input-field" placeholder="Any details about the food…"
              {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Food Type *</label>
              <select className={`input-field ${errors.foodType ? 'input-error' : ''}`}
                {...register('foodType', { required: 'Required' })}>
                <option value="VEG">Veg</option>
                <option value="NON_VEG">Non-Veg</option>
                <option value="VEGAN">Vegan</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>
            <div>
              <label className="label-field">Quantity *</label>
              <input type="number" min={1} className={`input-field ${errors.quantity ? 'input-error' : ''}`}
                placeholder="e.g. 4"
                {...register('quantity', { required: 'Required', min: { value: 1, message: 'Min 1' }, valueAsNumber: true })} />
              {errors.quantity && <p className="error-text">{errors.quantity.message}</p>}
            </div>
          </div>

          <div>
            <label className="label-field">Quantity Unit</label>
            <select className="input-field" {...register('quantityUnit')}>
              <option value="SERVINGS">Servings</option>
              <option value="KG">Kg</option>
              <option value="PACKETS">Packets</option>
              <option value="BOXES">Boxes</option>
              <option value="LITERS">Liters</option>
            </select>
          </div>

          <div>
            <label className="label-field">Pickup Address *</label>
            <input className={`input-field ${errors.pickupAddress ? 'input-error' : ''}`}
              placeholder="Street address where receiver can pick up"
              {...register('pickupAddress', { required: 'Address is required' })} />
            {errors.pickupAddress && <p className="error-text">{errors.pickupAddress.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">City *</label>
              <input className={`input-field ${errors.pickupCity ? 'input-error' : ''}`}
                placeholder="e.g. Pune"
                {...register('pickupCity', { required: 'City is required' })} />
              {errors.pickupCity && <p className="error-text">{errors.pickupCity.message}</p>}
            </div>
            <div>
              <label className="label-field">Your Contact Phone *</label>
              <input className={`input-field ${errors.contactPhone ? 'input-error' : ''}`}
                placeholder="10-digit number"
                {...register('contactPhone', {
                  required: 'Phone is required',
                  pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid number' },
                })} />
              {errors.contactPhone && <p className="error-text">{errors.contactPhone.message}</p>}
            </div>
          </div>

          <div>
            <label className="label-field">Preferred Pickup Time</label>
            <input className="input-field" placeholder="e.g. Between 2PM - 6PM today"
              {...register('preferredTime')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving
                ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : editData?.id ? 'Update' : 'Post Donation'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function DonorDirectDonationsPage() {
  const [donations, setDonations]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeTab, setActiveTab]   = useState('ALL');
  const [showForm, setShowForm]     = useState(false);
  const [editData, setEditData]     = useState(null);
  const [completing, setCompleting] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const navigate = useNavigate();

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await directDonationService.getMyDonations({
        status: activeTab === 'ALL' ? undefined : activeTab,
        page, size: 10,
      });
      setDonations(result.content || []);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [activeTab, page]);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);
  useEffect(() => { setPage(0); }, [activeTab]);

  const handleComplete = async (id) => {
    setCompleting(id);
    try {
      await directDonationService.complete(id);
      toast.success('Marked as completed!');
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setCompleting(null); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this donation?')) return;
    setCancelling(id);
    try {
      await directDonationService.cancel(id, 'Cancelled by donor');
      toast.success('Donation cancelled');
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setCancelling(null); }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-sm">
              <GiftIcon className="w-5 h-5 text-white" />
            </span>
            Direct Donations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {totalElements > 0 ? `${totalElements} donations` : 'Donate food directly to receivers'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDonations} className="btn-icon">
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setEditData(null); setShowForm(true); }} className="btn-primary">
            <PlusIcon className="w-4 h-4" /> Post Donation
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => {
          const meta = STATUS_META[tab];
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary-300'
              }`}>
              {meta && <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />}
              {tab}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : donations.length === 0 ? (
        <div className="card p-16 text-center">
          <GiftIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
            No direct donations yet
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Post a donation and receivers in your city can accept it directly.
          </p>
          <button onClick={() => { setEditData(null); setShowForm(true); }} className="btn-primary text-sm">
            <PlusIcon className="w-4 h-4" /> Post First Donation
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {donations.map((d, i) => {
            const meta      = STATUS_META[d.status] || STATUS_META.AVAILABLE;
            const isAccepted  = d.status === 'ACCEPTED';
            const isAvailable = d.status === 'AVAILABLE';
            const isCompleted = d.status === 'COMPLETED';

            return (
              <motion.div key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`card p-5 transition-all ${
                  isAccepted ? 'border-l-4 border-l-amber-400' :
                  isCompleted ? 'border-l-4 border-l-emerald-400' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                  {/* Info */}
                  <div className="flex gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isAccepted  ? 'bg-amber-50 dark:bg-amber-900/20'   :
                      isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                                    'bg-primary-50 dark:bg-primary-900/20'
                    }`}>
                      <GiftIcon className={`w-6 h-6 ${
                        isAccepted  ? 'text-amber-500'   :
                        isCompleted ? 'text-emerald-500' : 'text-primary-500'
                      }`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{d.title}</h3>
                        <span className={`badge ${meta.color}`}>{meta.label}</span>
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

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span>{d.quantity} {d.quantityUnit?.toLowerCase()}</span>
                        <span className="flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5" />{d.pickupCity}</span>
                        <span className="flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5" />{d.contactPhone}</span>
                        {d.preferredTime && (
                          <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{d.preferredTime}</span>
                        )}
                      </div>

                      {/* Receiver info — shown when ACCEPTED or COMPLETED */}
                      {(isAccepted || isCompleted) && d.receiverName && (
                        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {d.receiverName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                              {isAccepted ? 'Accepted by' : 'Received by'}: {d.receiverName}
                            </p>
                            {d.receiverNote && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 italic">"{d.receiverNote}"</p>
                            )}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-slate-400 mt-1.5">{formatRelativeTime(d.createdAt)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 shrink-0">

                    {/* ✅ View Details — navigates to detail page */}
                    <button
                      onClick={() => navigate(`/donor/direct-donations/${d.id}`)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                    >
                      <EyeIcon className="w-4 h-4" /> Details
                    </button>

                    {/* Chat — when ACCEPTED */}
                    {isAccepted && (
                      <button
                        onClick={() => navigate(`/donor/direct-donations/${d.id}/chat`)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 hover:bg-accent-100 transition-colors relative"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" /> Chat
                        {d.unreadMessages > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                            {d.unreadMessages}
                          </span>
                        )}
                      </button>
                    )}

                    {/* Edit — only AVAILABLE */}
                    {isAvailable && (
                      <button
                        onClick={() => { setEditData(d); setShowForm(true); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-100 transition-colors"
                      >
                        <PencilIcon className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}

                    {/* Mark Done — only ACCEPTED */}
                    {isAccepted && (
                      <button
                        onClick={() => handleComplete(d.id)}
                        disabled={completing === d.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                      >
                        {completing === d.id
                          ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          : <CheckBadgeIcon className="w-3.5 h-3.5" />}
                        Mark Done
                      </button>
                    )}

                    {/* Cancel — AVAILABLE or ACCEPTED */}
                    {(isAvailable || isAccepted) && (
                      <button
                        onClick={() => handleCancel(d.id)}
                        disabled={cancelling === d.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 hover:bg-danger-100 transition-colors"
                      >
                        {cancelling === d.id
                          ? <span className="w-3.5 h-3.5 border-2 border-danger-300 border-t-danger-600 rounded-full animate-spin" />
                          : <XMarkIcon className="w-3.5 h-3.5" />}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-slate-500 px-3">Page {page + 1} of {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <DonationFormModal
            editData={editData}
            onClose={() => { setShowForm(false); setEditData(null); }}
            onSaved={fetchDonations}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
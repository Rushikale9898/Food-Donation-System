import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  MagnifyingGlassIcon, MapPinIcon, ClockIcon,
  PhoneIcon, GiftIcon, CheckIcon, FunnelIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import directDonationService from '../../services/directDonationService';
import { formatRelativeTime, initials } from '../../utils/formatters';

const FOOD_TYPE_COLORS = {
  VEG:     'badge-success',
  NON_VEG: 'badge-danger',
  VEGAN:   'badge-info',
  MIXED:   'badge-neutral',
};

export default function ReceiverBrowsePage() {
  const [donations, setDonations]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [city, setCity]             = useState('');
  const [query, setQuery]           = useState('');
  const [accepting, setAccepting]   = useState(null);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [acceptNote, setAcceptNote] = useState('');
  const navigate = useNavigate();

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const result = await directDonationService.browse({
        city: city.trim() || undefined,
        q:    query.trim() || undefined,
        page,
        size: 9,
      });
      setDonations(result.content || []);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [city, query, page]);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchDonations();
  };

  const handleAccept = async () => {
    if (!selectedDonation) return;
    setAccepting(selectedDonation.id);
    try {
      await directDonationService.accept(selectedDonation.id, acceptNote);
      toast.success('🎉 Donation accepted! Check your notifications for donor contact details.');
      setSelectedDonation(null);
      fetchDonations();
      navigate('/receiver/my-received');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to accept donation');
    } finally {
      setAccepting(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-sm">
            <GiftIcon className="w-5 h-5 text-white" />
          </span>
          Available Donations
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {totalElements > 0 ? `${totalElements} donations available` : 'Browse food donations from generous donors'}
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-11" placeholder="Search by food name…"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="relative sm:w-48">
          <MapPinIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input-field pl-11" placeholder="Filter by city"
            value={city} onChange={e => setCity(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary shrink-0">
          <FunnelIcon className="w-4 h-4" /> Search
        </button>
      </form>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="card p-16 text-center">
          <GiftIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="font-display text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
            No donations found
          </h3>
          <p className="text-slate-400 text-sm">
            {city ? `No donations in "${city}" right now.` : 'No donations available right now.'}
          </p>
          {city && (
            <button onClick={() => { setCity(''); setPage(0); }} className="btn-outline mt-3 text-sm !py-2">
              Clear city filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {donations.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card overflow-hidden flex flex-col hover:shadow-card-hover transition-all duration-300"
            >
              <div className="h-2 bg-gradient-to-r from-primary-500 to-accent-500" />
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${FOOD_TYPE_COLORS[d.foodType] || 'badge-neutral'}`}>
                    {d.foodType?.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400">{formatRelativeTime(d.createdAt)}</span>
                </div>

                <h3 className="font-display font-semibold text-slate-900 dark:text-white text-base mb-1 line-clamp-2">
                  {d.title}
                </h3>
                {d.description && (
                  <p className="text-slate-500 dark:text-slate-400 text-xs mb-3 line-clamp-2">{d.description}</p>
                )}

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <GiftIcon className="w-4 h-4 text-primary-400 shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      {d.quantity} {d.quantityUnit?.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{d.pickupCity}</span>
                  </div>
                  {d.preferredTime && (
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">{d.preferredTime}</span>
                    </div>
                  )}
                </div>

                {/* Donor info */}
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 mb-4 mt-auto">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                    {d.donorProfileImage
                      ? <img src={d.donorProfileImage} alt="" className="w-full h-full object-cover" />
                      : initials(d.donorName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{d.donorName}</p>
                    <p className="text-xs text-slate-400 truncate">{d.pickupCity}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {/* ✅ FIX: navigate to /receiver/donations/:id */}
                  <button
                    onClick={() => navigate(`/receiver/donations/${d.id}`)}
                    className="btn-secondary flex-1 text-xs !py-2 justify-center"
                  >
                    <EyeIcon className="w-3.5 h-3.5" /> View Details
                  </button>
                  <button
                    onClick={() => { setSelectedDonation(d); setAcceptNote(''); }}
                    className="btn-primary flex-1 text-xs !py-2 justify-center"
                  >
                    <CheckIcon className="w-3.5 h-3.5" /> Accept
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
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

      {/* Accept Modal */}
      <AnimatePresence>
        {selectedDonation && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedDonation(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-premium border border-slate-100 dark:border-slate-800 p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <GiftIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-slate-900 dark:text-white">Accept Donation</h3>
                  <p className="text-xs text-slate-400">from {selectedDonation.donorName}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 mb-4 space-y-1 text-sm">
                <p className="font-semibold text-slate-900 dark:text-white">{selectedDonation.title}</p>
                <p className="text-slate-500 text-xs">
                  {selectedDonation.quantity} {selectedDonation.quantityUnit?.toLowerCase()} · {selectedDonation.pickupCity}
                </p>
                {selectedDonation.preferredTime && (
                  <p className="text-xs text-slate-500">
                    <ClockIcon className="w-3.5 h-3.5 inline mr-1" />
                    Pickup time: {selectedDonation.preferredTime}
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 mb-4">
                <PhoneIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  After accepting, the donor's contact number <strong>{selectedDonation.contactPhone}</strong> will be shared with you.
                </p>
              </div>

              <div className="mb-4">
                <label className="label-field">Add a note (optional)</label>
                <textarea rows={2} className="input-field"
                  placeholder="e.g. I'll pick it up between 3–5 PM…"
                  value={acceptNote}
                  onChange={e => setAcceptNote(e.target.value)} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSelectedDonation(null)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button
                  onClick={handleAccept}
                  disabled={accepting === selectedDonation.id}
                  className="btn-primary flex-1 justify-center"
                >
                  {accepting === selectedDonation.id
                    ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <><CheckIcon className="w-4 h-4" /> Accept</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
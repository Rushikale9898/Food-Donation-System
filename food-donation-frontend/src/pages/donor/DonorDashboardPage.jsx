import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardDocumentListIcon, GiftIcon, CheckCircleIcon,
  ClockIcon, CheckBadgeIcon, ArrowRightIcon,
  PlusIcon, UserGroupIcon, HeartIcon,
} from '@heroicons/react/24/outline';
import dashboardService from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';
 
export default function DonorDashboardPage() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
 
  useEffect(() => {
    dashboardService.getDonorDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
 
  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-64" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
 
  // ── Stat card data ──────────────────────────────────────────
  const MAIN_STATS = [
    {
      label:    'Total Donations',
      value:    stats?.totalDonationsAll ?? 0,
      sub:      `${stats?.myDonations ?? 0} regular + ${stats?.myDirectDonations ?? 0} direct`,
      icon:     GiftIcon,
      gradient: 'bg-gradient-to-br from-primary-500 to-primary-700',
      path:     null, // summary card — no navigation
      glow:     'shadow-glow-md',
    },
    {
      label:    'Regular Donations',
      value:    stats?.myDonations ?? 0,
      sub:      `${stats?.pendingDonationsCount ?? 0} pending · ${stats?.approvedDonationsCount ?? 0} approved`,
      icon:     ClipboardDocumentListIcon,
      gradient: 'bg-gradient-to-br from-violet-500 to-violet-700',
      path:     '/donor/donations',
      glow:     '',
    },
    {
      label:    'Direct Donations',
      value:    stats?.myDirectDonations ?? 0,
      sub:      `${stats?.directAvailable ?? 0} available · ${stats?.directAccepted ?? 0} accepted`,
      icon:     UserGroupIcon,
      gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      path:     '/donor/direct-donations',
      glow:     '',
    },
    {
      label:    'Delivered',
      value:    (stats?.deliveredCount ?? 0) + (stats?.directCompleted ?? 0),
      sub:      `${stats?.deliveredCount ?? 0} via NGO · ${stats?.directCompleted ?? 0} direct`,
      icon:     CheckBadgeIcon,
      gradient: 'bg-gradient-to-br from-teal-500 to-teal-700',
      path:     null,
      glow:     '',
    },
  ];
 
  const DIRECT_STATS = [
    {
      label:    'Available',
      value:    stats?.directAvailable ?? 0,
      icon:     ClockIcon,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
      path:     '/donor/direct-donations?status=AVAILABLE',
    },
    {
      label:    'Accepted by Receiver',
      value:    stats?.directAccepted ?? 0,
      icon:     HeartIcon,
      gradient: 'bg-gradient-to-br from-amber-500 to-amber-700',
      path:     '/donor/direct-donations?status=ACCEPTED',
    },
    {
      label:    'Completed',
      value:    stats?.directCompleted ?? 0,
      icon:     CheckCircleIcon,
      gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      path:     '/donor/direct-donations?status=COMPLETED',
    },
    {
      label:    'Pending Approval',
      value:    stats?.pendingDonationsCount ?? 0,
      icon:     ClockIcon,
      gradient: 'bg-gradient-to-br from-orange-500 to-orange-700',
      path:     '/donor/donations',
    },
  ];
 
  return (
    <div className="space-y-8 animate-fade-in">
 
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.fullName?.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Here's an overview of all your food donations
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/donor/donations/new')} className="btn-primary text-sm">
            <PlusIcon className="w-4 h-4" /> New Donation
          </button>
          <button onClick={() => navigate('/donor/direct-donations')} className="btn-secondary text-sm">
            <UserGroupIcon className="w-4 h-4" /> Direct Donation
          </button>
        </div>
      </div>
 
      {/* ── MAIN STATS ─────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Overall Summary
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MAIN_STATS.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={card.path ? { y: -2, scale: 1.01 } : {}}
              onClick={() => card.path && navigate(card.path)}
              className={`${card.gradient} ${card.glow} rounded-2xl p-5 text-white transition-all duration-300 ${
                card.path ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 text-xs font-medium">{card.label}</p>
                  <p className="font-display text-3xl font-bold mt-1">{card.value}</p>
                  {card.sub && (
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">{card.sub}</p>
                  )}
                </div>
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 ml-2">
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              {card.path && (
                <div className="flex items-center gap-1 mt-3 text-white/70 text-xs font-medium">
                  View all <ArrowRightIcon className="w-3 h-3" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
 
      {/* ── DETAILED BREAKDOWN ─────────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Breakdown by Status
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DIRECT_STATS.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 + i * 0.06 }}
              whileHover={{ y: -2, scale: 1.01 }}
              onClick={() => navigate(card.path)}
              className={`${card.gradient} rounded-2xl p-5 text-white cursor-pointer transition-all duration-300`}
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/70 text-xs font-medium">{card.label}</p>
                  <p className="font-display text-3xl font-bold mt-1">{card.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-white/70 text-xs font-medium">
                View <ArrowRightIcon className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
 
      {/* ── QUICK ACTIONS ──────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/donor/donations')}
          className="card p-5 text-left hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
              <ClipboardDocumentListIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="font-display font-semibold text-slate-900 dark:text-white text-sm">
              My Regular Donations
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            Manage food donations distributed through NGOs and delivery agents.
          </p>
          <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 text-xs font-semibold mt-3 group-hover:gap-2 transition-all">
            View all {stats?.myDonations ?? 0} donations
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </div>
        </button>
 
        <button
          onClick={() => navigate('/donor/direct-donations')}
          className="card p-5 text-left hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <UserGroupIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-display font-semibold text-slate-900 dark:text-white text-sm">
              My Direct Donations
            </h3>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            Donate directly to individual receivers without NGO involvement.
          </p>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mt-3 group-hover:gap-2 transition-all">
            View all {stats?.myDirectDonations ?? 0} direct donations
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    </div>
  );
}
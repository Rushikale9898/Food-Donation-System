import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GiftIcon, CheckCircleIcon, ClockIcon,
  MagnifyingGlassIcon, ChatBubbleLeftRightIcon,
  ArrowRightIcon, HeartIcon,
} from '@heroicons/react/24/outline';
import directDonationService from '../../services/directDonationService';
import { formatRelativeTime } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

export default function ReceiverDashboardPage() {
  const [stats,     setStats]     = useState(null);
  const [recent,    setRecent]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [received, available, unread] = await Promise.all([
          directDonationService.getMyReceived({ page: 0, size: 5 }),
          directDonationService.browse({ page: 0, size: 3 }),
          directDonationService.getUnreadCount(),
        ]);
        const all = received.content || [];
        setStats({
          total:     received.totalElements || 0,
          accepted:  all.filter(d => d.status === 'ACCEPTED').length,
          completed: all.filter(d => d.status === 'COMPLETED').length,
          available: available.totalElements || 0,
        });
        setRecent(all.slice(0, 5));
        setUnreadMsg(unread);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STAT_CARDS = [
    { label: 'Total Received',    value: stats?.total,     icon: GiftIcon,              gradient: 'stat-card-blue',   path: '/receiver/my-received' },
    { label: 'Active Pickups',    value: stats?.accepted,  icon: ClockIcon,             gradient: 'stat-card-amber',  path: '/receiver/my-received?status=ACCEPTED' },
    { label: 'Completed',         value: stats?.completed, icon: CheckCircleIcon,       gradient: 'stat-card-emerald',path: '/receiver/my-received?status=COMPLETED' },
    { label: 'Available Near You',value: stats?.available, icon: HeartIcon,             gradient: 'stat-card-violet', path: '/receiver/browse' },
  ];

  if (loading) return (
    <div className="space-y-6">
      <div className="skeleton h-8 w-56" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.fullName?.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Browse available food donations near you
          </p>
        </div>
        {unreadMsg > 0 && (
          <button
            onClick={() => navigate('/receiver/messages')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-semibold shadow-md hover:bg-accent-600 transition-colors"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            {unreadMsg} new message{unreadMsg > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -2 }}
            onClick={() => navigate(card.path)}
            className={`${card.gradient} rounded-2xl p-5 text-white cursor-pointer transition-all duration-300`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-sm font-medium">{card.label}</p>
                <p className="font-display text-3xl font-bold mt-1">{card.value ?? 0}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/receiver/browse')}
          className="card p-6 text-left hover:shadow-card-hover transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
            <MagnifyingGlassIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-1">Browse Donations</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Find available food donations from donors near you.</p>
          <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 text-sm font-medium mt-3">
            Browse now <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => navigate('/receiver/messages')}
          className="card p-6 text-left hover:shadow-card-hover transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center mb-4 group-hover:bg-accent-100 transition-colors">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-accent-600 dark:text-accent-400" />
          </div>
          <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-1">Messages</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Chat directly with donors to coordinate pickups.</p>
          <div className="flex items-center gap-1 text-accent-600 dark:text-accent-400 text-sm font-medium mt-3">
            {unreadMsg > 0 ? `${unreadMsg} unread` : 'View messages'} <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Recent activity */}
      {recent.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
            <button onClick={() => navigate('/receiver/my-received')}
              className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline">
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {recent.map(d => (
              <div key={d.id}
                onClick={() => navigate(`/receiver/donations/${d.id}`)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                  <GiftIcon className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{d.title}</p>
                  <p className="text-xs text-slate-400">from {d.donorName} · {formatRelativeTime(d.createdAt)}</p>
                </div>
                <span className={`badge shrink-0 ${
                  d.status === 'COMPLETED' ? 'badge-success' :
                  d.status === 'ACCEPTED'  ? 'badge-info'    :
                  d.status === 'CANCELLED' ? 'badge-danger'  : 'badge-neutral'
                }`}>
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
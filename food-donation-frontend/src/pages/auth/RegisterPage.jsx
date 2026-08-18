// FILE: src/pages/auth/RegisterPage.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircleIcon, EnvelopeIcon, PhoneIcon, LockClosedIcon,
  BuildingStorefrontIcon, HeartIcon, TruckIcon, HandRaisedIcon,
  MapPinIcon, EyeIcon, EyeSlashIcon, ChevronRightIcon,
  ChevronLeftIcon, CheckCircleIcon, UserGroupIcon,
  HomeIcon, BuildingOffice2Icon, SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

// ── Role cards ─────────────────────────────────────────────
const ROLES = [
  {
    id:       'DONOR',
    label:    'Food Donor',
    icon:     BuildingStorefrontIcon,
    color:    'from-primary-500 to-primary-600',
    bg:       'bg-primary-50 dark:bg-primary-900/20',
    border:   'border-primary-300 dark:border-primary-600',
    desc:     'Restaurant, hotel, caterer or individual with surplus food to donate',
    examples: ['Restaurant', 'Hotel', 'Caterer', 'Individual'],
  },
  {
    id:       'NGO',
    label:    'NGO / Organization',
    icon:     HeartIcon,
    color:    'from-accent-500 to-accent-600',
    bg:       'bg-accent-50 dark:bg-accent-900/20',
    border:   'border-accent-300 dark:border-accent-600',
    desc:     'Registered NGO or organization that distributes food to communities',
    examples: ['Food Bank', 'Charity', 'Trust', 'Foundation'],
  },
  {
    id:       'DELIVERY_AGENT',
    label:    'Delivery Agent',
    icon:     TruckIcon,
    color:    'from-amber-500 to-amber-600',
    bg:       'bg-amber-50 dark:bg-amber-900/20',
    border:   'border-amber-300 dark:border-amber-600',
    desc:     'Volunteer to pick up and deliver food donations to NGOs',
    examples: ['Bike', 'Car', 'Van', 'Cycle'],
  },
  {
    id:       'RECEIVER',
    label:    'Receiver',
    icon:     HandRaisedIcon,
    color:    'from-emerald-500 to-emerald-600',
    bg:       'bg-emerald-50 dark:bg-emerald-900/20',
    border:   'border-emerald-300 dark:border-emerald-600',
    desc:     'Individual or family in need — receive small food donations directly from donors',
    examples: ['Individual', 'Family', 'Orphanage', 'Shelter'],
  },
];

const RECEIVER_TYPES = [
  { value: 'INDIVIDUAL',   label: 'Individual',    icon: UserCircleIcon      },
  { value: 'FAMILY',       label: 'Family',         icon: HomeIcon            },
  { value: 'ORPHANAGE',    label: 'Orphanage',      icon: UserGroupIcon       },
  { value: 'OLD_AGE_HOME', label: 'Old Age Home',   icon: BuildingOffice2Icon },
  { value: 'SHELTER',      label: 'Shelter Home',   icon: HomeIcon            },
  { value: 'OTHER',        label: 'Other',          icon: SparklesIcon        },
];

const DONOR_TYPES = [
  'RESTAURANT', 'HOTEL', 'SUPERMARKET', 'CATERER',
  'EVENT_ORGANIZER', 'INDIVIDUAL', 'OTHER',
];

const VEHICLE_TYPES = ['BIKE', 'CAR', 'VAN', 'CYCLE', 'WALK'];

// ── Step 2 fields to validate before going to step 3 ───────
const STEP2_FIELDS = [
  'fullName', 'email', 'phone',
  'password', 'confirmPassword',
  'city', 'state',
];

export default function RegisterPage() {
  const [step, setStep]               = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [serverError, setServerError] = useState('');

  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  // ONE form instance for all steps — this is the fix
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      donorType:    'RESTAURANT',
      vehicleType:  'BIKE',
      receiverType: 'INDIVIDUAL',
    },
  });

  const passwordValue   = watch('password');
  const watchedRole     = watch('vehicleType');
  const watchRecType    = watch('receiverType');
  const watchDonorType  = watch('donorType');
  const watchVehicle    = watch('vehicleType');

  const roleInfo = ROLES.find(r => r.id === selectedRole);

  // ── Step 1 → Step 2 ──────────────────────────────────────
  const goToStep2 = () => {
    if (!selectedRole) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Step 2 → Step 3 (validate step 2 fields first) ───────
  const goToStep3 = async () => {
    // Trigger validation only for Step 2 fields
    const isValid = await trigger(STEP2_FIELDS);
    if (isValid) {
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    setStep(s => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Final submit ──────────────────────────────────────────
  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    try {
      const payload = {
        fullName: data.fullName.trim(),
        email:    data.email.trim().toLowerCase(),
        phone:    data.phone.trim(),
        password: data.password,
        city:     data.city?.trim(),
        state:    data.state?.trim(),
        address:  data.address?.trim() || '',
        role:     selectedRole,
      };

      if (selectedRole === 'DONOR') {
        payload.donorType    = data.donorType;
        payload.organization = data.organization?.trim() || '';
        payload.fssaiNumber  = data.fssaiNumber?.trim() || '';
      }
      if (selectedRole === 'NGO') {
        payload.organizationName   = data.organizationName?.trim() || '';
        payload.registrationNumber = data.registrationNumber?.trim() || '';
        payload.description        = data.ngoDescription?.trim() || '';
        payload.foodCapacity       = data.foodCapacity ? Number(data.foodCapacity) : null;
        payload.serviceArea        = data.serviceArea?.trim() || '';
      }
      if (selectedRole === 'DELIVERY_AGENT') {
        payload.vehicleType   = data.vehicleType;
        payload.vehicleNumber = data.vehicleNumber?.trim() || '';
        payload.licenseNumber = data.licenseNumber?.trim() || '';
      }
      if (selectedRole === 'RECEIVER') {
        payload.receiverType  = data.receiverType;
        payload.familySize    = data.familySize ? Number(data.familySize) : null;
        payload.specialNeeds  = data.specialNeeds?.trim() || '';
        payload.idProofType   = data.idProofType?.trim() || '';
        payload.idProofNumber = data.idProofNumber?.trim() || '';
      }

      await registerUser(payload);

      const paths = {
        DONOR:          '/donor/dashboard',
        NGO:            '/ngo/dashboard',
        DELIVERY_AGENT: '/agent/dashboard',
        RECEIVER:       '/receiver/dashboard',
      };
      navigate(paths[selectedRole] || '/');
    } catch (err) {
      const msg = err.response?.data?.error
        || err.response?.data?.message
        || 'Registration failed. Please try again.';
      setServerError(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-accent-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-400/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow-sm">
              <HeartIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-slate-900 dark:text-white">FoodShare</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Join thousands making a difference</p>
        </div>

        {/* Progress bar */}
        {step < 4 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {['Choose Role', 'Basic Info', 'More Details'].map((label, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > i + 1
                      ? 'bg-emerald-500 text-white'
                      : step === i + 1
                        ? 'bg-primary-500 text-white shadow-glow-sm'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    {step > i + 1
                      ? <CheckCircleIcon className="w-4 h-4" />
                      : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${
                    step === i + 1
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-slate-400'
                  }`}>
                    {label}
                  </span>
                  {i < 2 && (
                    <ChevronRightIcon className="w-3 h-3 text-slate-300 dark:text-slate-600 mx-2 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                animate={{ width: `${((step - 1) / 2) * 100}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
          </div>
        )}

        {/* Server error banner */}
        {serverError && (
          <div className="mb-4 p-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-100 dark:border-danger-800 text-danger-700 dark:text-danger-400 text-sm">
            {serverError}
          </div>
        )}

        {/*
          KEY FIX: ONE <form> wraps ALL steps.
          This means react-hook-form registers all fields regardless of which
          step is visible, and trigger() works correctly across steps.
        */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <AnimatePresence mode="wait">

            {/* ══════════════════════════════════════════════
                STEP 1 — Choose Role
            ══════════════════════════════════════════════ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="card p-6"
              >
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-1">
                  How would you like to join?
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Choose the role that best describes you
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  {ROLES.map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                        selectedRole === role.id
                          ? `${role.border} ${role.bg} shadow-md`
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shrink-0 shadow-sm`}>
                          <role.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{role.label}</p>
                            {selectedRole === role.id && (
                              <CheckCircleIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                            {role.desc}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {role.examples.map(ex => (
                              <span key={ex} className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                                {ex}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goToStep2}
                  disabled={!selectedRole}
                  className="btn-primary w-full justify-center !py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue as {selectedRole
                    ? ROLES.find(r => r.id === selectedRole)?.label
                    : '…'}
                  <ChevronRightIcon className="w-4 h-4" />
                </button>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                STEP 2 — Basic Info
            ══════════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="card p-6"
              >
                {/* Role indicator */}
                {roleInfo && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${roleInfo.bg} border ${roleInfo.border} mb-5`}>
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${roleInfo.color} flex items-center justify-center`}>
                      <roleInfo.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      Registering as <strong>{roleInfo.label}</strong>
                    </span>
                  </div>
                )}

                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-5">
                  Basic Information
                </h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="label-field">Full Name *</label>
                    <div className="relative">
                      <UserCircleIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        className={`input-field pl-11 ${errors.fullName ? 'input-error' : ''}`}
                        placeholder="Your full name"
                        {...register('fullName', {
                          required:  'Full name is required',
                          minLength: { value: 2,   message: 'At least 2 characters' },
                          maxLength: { value: 100, message: 'Max 100 characters'    },
                        })}
                      />
                    </div>
                    {errors.fullName && <p className="error-text">{errors.fullName.message}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="label-field">Email Address *</label>
                    <div className="relative">
                      <EnvelopeIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        className={`input-field pl-11 ${errors.email ? 'input-error' : ''}`}
                        placeholder="you@example.com"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value:   /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Enter a valid email address',
                          },
                        })}
                      />
                    </div>
                    {errors.email && <p className="error-text">{errors.email.message}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="label-field">Phone Number *</label>
                    <div className="relative">
                      <PhoneIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        maxLength={10}
                        className={`input-field pl-11 ${errors.phone ? 'input-error' : ''}`}
                        placeholder="10-digit mobile number"
                        {...register('phone', {
                          required: 'Phone number is required',
                          pattern: {
                            value:   /^[6-9]\d{9}$/,
                            message: 'Enter a valid 10-digit Indian mobile number',
                          },
                        })}
                      />
                    </div>
                    {errors.phone && <p className="error-text">{errors.phone.message}</p>}
                  </div>

                  {/* City + State */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-field">City *</label>
                      <div className="relative">
                        <MapPinIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          className={`input-field pl-11 ${errors.city ? 'input-error' : ''}`}
                          placeholder="e.g. Pune"
                          {...register('city', { required: 'City is required' })}
                        />
                      </div>
                      {errors.city && <p className="error-text">{errors.city.message}</p>}
                    </div>
                    <div>
                      <label className="label-field">State *</label>
                      <input
                        className={`input-field ${errors.state ? 'input-error' : ''}`}
                        placeholder="e.g. Maharashtra"
                        {...register('state', { required: 'State is required' })}
                      />
                      {errors.state && <p className="error-text">{errors.state.message}</p>}
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="label-field">Address</label>
                    <textarea
                      rows={2}
                      className="input-field"
                      placeholder="Street address, area…"
                      {...register('address')}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="label-field">Password *</label>
                    <div className="relative">
                      <LockClosedIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        className={`input-field pl-11 pr-11 ${errors.password ? 'input-error' : ''}`}
                        placeholder="Min. 8 characters"
                        {...register('password', {
                          required:  'Password is required',
                          minLength: { value: 8, message: 'At least 8 characters' },
                          pattern: {
                            value:   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                            message: 'Must include uppercase, lowercase, number & symbol (@$!%*?&)',
                          },
                        })}
                      />
                      <button type="button" onClick={() => setShowPwd(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPwd ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="error-text">{errors.password.message}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="label-field">Confirm Password *</label>
                    <div className="relative">
                      <LockClosedIcon className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConfirmPwd ? 'text' : 'password'}
                        className={`input-field pl-11 pr-11 ${errors.confirmPassword ? 'input-error' : ''}`}
                        placeholder="Re-enter your password"
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: v => v === passwordValue || 'Passwords do not match',
                        })}
                      />
                      <button type="button" onClick={() => setShowConfirmPwd(p => !p)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirmPwd ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="error-text">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                {/* Navigation — NOTE: both are type="button" to prevent form submit */}
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={goBack} className="btn-secondary flex-1 justify-center">
                    <ChevronLeftIcon className="w-4 h-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={goToStep3}
                    className="btn-primary flex-1 justify-center !py-3"
                  >
                    Continue <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════
                STEP 3 — Role-specific Details
            ══════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="card p-6"
              >
                {roleInfo && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${roleInfo.bg} border ${roleInfo.border} mb-5`}>
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${roleInfo.color} flex items-center justify-center`}>
                      <roleInfo.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {roleInfo.label} — Additional Details
                    </span>
                  </div>
                )}

                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mb-5">
                  {selectedRole === 'RECEIVER' ? 'Tell us about yourself' : 'Professional Details'}
                </h2>

                <div className="space-y-4">

                  {/* ── DONOR ──────────────────────────────── */}
                  {selectedRole === 'DONOR' && (
                    <>
                      <div>
                        <label className="label-field">Donor Type *</label>
                        <select
                          className={`input-field ${errors.donorType ? 'input-error' : ''}`}
                          {...register('donorType', { required: 'Please select donor type' })}
                        >
                          {DONOR_TYPES.map(t => (
                            <option key={t} value={t}>{t.replace('_', ' ')}</option>
                          ))}
                        </select>
                        {errors.donorType && <p className="error-text">{errors.donorType.message}</p>}
                      </div>
                      <div>
                        <label className="label-field">Organization / Business Name</label>
                        <input className="input-field" placeholder="e.g. Sharma Restaurant"
                          {...register('organization')} />
                      </div>
                      <div>
                        <label className="label-field">FSSAI License Number</label>
                        <input className="input-field" placeholder="Optional — for food businesses"
                          {...register('fssaiNumber')} />
                      </div>
                    </>
                  )}

                  {/* ── NGO ────────────────────────────────── */}
                  {selectedRole === 'NGO' && (
                    <>
                      <div>
                        <label className="label-field">Organization Name *</label>
                        <input
                          className={`input-field ${errors.organizationName ? 'input-error' : ''}`}
                          placeholder="e.g. Helping Hands Foundation"
                          {...register('organizationName', { required: 'Organization name is required' })}
                        />
                        {errors.organizationName && <p className="error-text">{errors.organizationName.message}</p>}
                      </div>
                      <div>
                        <label className="label-field">Registration Number</label>
                        <input className="input-field" placeholder="NGO registration number (optional)"
                          {...register('registrationNumber')} />
                      </div>
                      <div>
                        <label className="label-field">About Your Organization</label>
                        <textarea rows={2} className="input-field"
                          placeholder="Brief description of your NGO and work…"
                          {...register('ngoDescription')} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label-field">Food Capacity (servings/day)</label>
                          <input type="number" min={1} className="input-field" placeholder="e.g. 200"
                            {...register('foodCapacity', { valueAsNumber: true })} />
                        </div>
                        <div>
                          <label className="label-field">Service Area</label>
                          <input className="input-field" placeholder="e.g. Pune, Pimpri"
                            {...register('serviceArea')} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── DELIVERY AGENT ──────────────────────── */}
                  {selectedRole === 'DELIVERY_AGENT' && (
                    <>
                      <div>
                        <label className="label-field">Vehicle Type *</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {VEHICLE_TYPES.map(v => (
                            <label key={v}
                              className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 cursor-pointer text-xs font-medium transition-all ${
                                watchVehicle === v
                                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                              }`}
                            >
                              <input type="radio" value={v} className="sr-only"
                                {...register('vehicleType', { required: 'Select vehicle type' })} />
                              <TruckIcon className="w-5 h-5" />
                              {v}
                            </label>
                          ))}
                        </div>
                        {errors.vehicleType && <p className="error-text">{errors.vehicleType.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label-field">Vehicle Number</label>
                          <input className="input-field" placeholder="e.g. MH12AB1234"
                            {...register('vehicleNumber')} />
                        </div>
                        <div>
                          <label className="label-field">License Number</label>
                          <input className="input-field" placeholder="Driving license no."
                            {...register('licenseNumber')} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── RECEIVER ────────────────────────────── */}
                  {selectedRole === 'RECEIVER' && (
                    <>
                      <div>
                        <label className="label-field">Receiver Type *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {RECEIVER_TYPES.map(t => (
                            <label key={t.value}
                              className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                watchRecType === t.value
                                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <input type="radio" value={t.value} className="sr-only"
                                {...register('receiverType', { required: 'Please select receiver type' })} />
                              <t.icon className={`w-4 h-4 shrink-0 ${
                                watchRecType === t.value ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                              }`} />
                              <span className={`text-xs font-medium ${
                                watchRecType === t.value ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400'
                              }`}>
                                {t.label}
                              </span>
                            </label>
                          ))}
                        </div>
                        {errors.receiverType && <p className="error-text">{errors.receiverType.message}</p>}
                      </div>

                      <div>
                        <label className="label-field">Number of People / Family Size</label>
                        <input
                          type="number" min={1} max={100}
                          className="input-field"
                          placeholder="e.g. 4"
                          {...register('familySize', {
                            valueAsNumber: true,
                            min: { value: 1,   message: 'At least 1' },
                            max: { value: 100, message: 'Max 100'    },
                          })}
                        />
                        {errors.familySize && <p className="error-text">{errors.familySize.message}</p>}
                      </div>

                      <div>
                        <label className="label-field">Dietary Restrictions / Special Needs</label>
                        <textarea rows={2} className="input-field"
                          placeholder="e.g. No non-veg, nut allergy, diabetic friendly only…"
                          {...register('specialNeeds')} />
                        <p className="text-xs text-slate-400 mt-1">Helps donors provide the right food for you.</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wide">
                          Identity Verification (Optional — builds trust with donors)
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label-field">ID Proof Type</label>
                            <select className="input-field" {...register('idProofType')}>
                              <option value="">Select…</option>
                              <option value="Aadhaar">Aadhaar Card</option>
                              <option value="Ration Card">Ration Card</option>
                              <option value="Voter ID">Voter ID</option>
                              <option value="PAN Card">PAN Card</option>
                              <option value="Passport">Passport</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="label-field">ID Number</label>
                            <input className="input-field" placeholder="ID proof number"
                              {...register('idProofNumber')} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                        <CheckCircleIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-primary-700 dark:text-primary-400">
                          Your personal information is kept private and only shared with donors when you accept a donation.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Terms */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
                      {...register('terms', { required: 'You must accept the terms to continue' })}
                    />
                    <label htmlFor="terms" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer">
                      I agree to the{' '}
                      <Link to="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</Link>
                    </label>
                  </div>
                  {errors.terms && <p className="error-text">{errors.terms.message}</p>}
                </div>

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={goBack} className="btn-secondary flex-1 justify-center">
                    <ChevronLeftIcon className="w-4 h-4" /> Back
                  </button>
                  {/* This is the ONLY submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 justify-center !py-3"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Creating account…
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        Create Account
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
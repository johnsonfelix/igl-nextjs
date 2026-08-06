'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  KeyRound,
  Save,
  Trash2,
  RefreshCw,
  Loader2
} from 'lucide-react';

type Company = {
  id: string;
  name: string;
  memberId?: string;
  status?: string;
};

type Branch = {
  id: string;
  name: string;
  city?: string;
  country?: string;
  company?: {
    id: string;
    name: string;
  };
};

type UserDetail = {
  id: string;
  email: string;
  name?: string | null;
  role: 'USER' | 'ADMIN' | 'MODERATOR' | string;
  isCompleted: boolean;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
  companies?: Company[];
  branch?: Branch | null;
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('USER');
  const [isCompleted, setIsCompleted] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  async function fetchUserDetail() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('User not found');
        throw new Error(`Server error (${res.status})`);
      }
      const data: UserDetail = await res.json();
      setUser(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setRole(data.role || 'USER');
      setIsCompleted(data.isCompleted || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload: any = {
        name,
        email,
        phone,
        role,
        isCompleted,
      };

      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Update failed (${res.status})`);
      }

      const updated: UserDetail = await res.json();
      setUser(updated);
      setNewPassword('');
      setSuccessMsg('User details updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const ok = confirm(`Are you sure you want to delete user "${user?.email}"? This action cannot be undone.`);
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Delete failed (${res.status})`);
      }

      router.push('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-gray-500 font-medium">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          Loading user details...
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-2">Error Loading User</h2>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchUserDetail}
            className="mt-4 inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition-all"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Users
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-200">
              {name ? name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {user?.name || 'Unnamed User'}
              </h1>
              <p className="text-sm text-gray-500 font-mono">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUserDetail}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm"
            title="Refresh Details"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-sm font-semibold transition-all"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete User
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 font-bold ml-4">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">
              Edit User Profile
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  System Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="MODERATOR">MODERATOR</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Profile Completion Switch */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">Profile Completion Status</p>
                <p className="text-xs text-gray-500">Mark whether this user has completed their onboarding/profile requirements.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCompleted(!isCompleted)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                {isCompleted ? '✓ Completed' : '⏳ Pending'}
              </button>
            </div>

            {/* Change Password Section */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Reset Password (Optional)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password to reset"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <p className="text-xs text-gray-400">Leave blank if you do not want to change the password.</p>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Meta info & Relations */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-gray-400">
              User Metadata
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" /> Role
                </span>
                <span className="font-semibold px-2.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">
                  {user?.role}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500 flex items-center gap-2">
                  {user?.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-amber-500" />
                  )}
                  Status
                </span>
                <span
                  className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${
                    user?.isCompleted
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {user?.isCompleted ? 'Completed' : 'Incomplete'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" /> Joined
                </span>
                <span className="font-medium text-gray-700">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" /> Last Updated
                </span>
                <span className="font-medium text-gray-700">
                  {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Associated Companies */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-gray-400 flex items-center justify-between">
              <span>Associated Companies</span>
              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                {user?.companies?.length || 0}
              </span>
            </h2>

            {user?.companies && user.companies.length > 0 ? (
              <div className="space-y-2">
                {user.companies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/admin/company/${company.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                          {company.name}
                        </p>
                        {company.memberId && (
                          <p className="text-xs text-gray-400 font-mono">ID: {company.memberId}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No companies linked to this user.</p>
            )}
          </div>

          {/* Associated Branch */}
          {user?.branch && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-gray-400">
                Associated Branch
              </h2>

              <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 space-y-1">
                <p className="text-sm font-bold text-gray-800">{user.branch.name}</p>
                {user.branch.company && (
                  <p className="text-xs text-gray-500">
                    Company: <span className="font-semibold text-gray-700">{user.branch.company.name}</span>
                  </p>
                )}
                {(user.branch.city || user.branch.country) && (
                  <p className="text-xs text-gray-400">
                    Location: {[user.branch.city, user.branch.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

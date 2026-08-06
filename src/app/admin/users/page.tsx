'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Trash2,
  UserCheck,
  UserX,
  Eye,
  Shield,
  Search,
  RefreshCw,
  Users as UsersIcon,
  Building2,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';

type Company = {
  id: string;
  name?: string;
};

type User = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  isCompleted: boolean;
  createdAt: string;
  companies?: Company[];
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data: User[] = await res.json();
      setUsers(data);
    } catch (err) {
      setUsers([]);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const setUserLoading = (id: string, val: boolean) => {
    setActionLoading(prev => ({ ...prev, [id]: val }));
  };

  async function handleDelete(id: string) {
    const targetUser = users.find(u => u.id === id);
    const ok = confirm(`Delete user "${targetUser?.email || id}"? This action cannot be undone.`);
    if (!ok) return;

    setUserLoading(id, true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Delete failed: ${res.status}`);
      }
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setUserLoading(id, false);
    }
  }

  async function handleToggleCompleted(user: User) {
    const id = user.id;
    setUserLoading(id, true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !user.isCompleted }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Update failed: ${res.status}`);
      }
      const updated: User = await res.json();
      setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)));
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setUserLoading(id, false);
    }
  }

  async function handleChangeRole(user: User, newRole: string) {
    if (!newRole || newRole === user.role) return;
    setUserLoading(user.id, true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Role update failed: ${res.status}`);
      }
      const updated: User = await res.json();
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, ...updated } : u)));
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setUserLoading(user.id, false);
    }
  }

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search term filter
      const term = searchTerm.toLowerCase().trim();
      const nameMatch = user.name?.toLowerCase().includes(term);
      const emailMatch = user.email.toLowerCase().includes(term);
      const companyMatch = user.companies?.some(c => c.name?.toLowerCase().includes(term));
      const searchMatch = !term || nameMatch || emailMatch || companyMatch;

      // Role filter
      const roleMatch = roleFilter === 'ALL' || user.role === roleFilter;

      // Status filter
      const statusMatch =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPLETED' && user.isCompleted) ||
        (statusFilter === 'PENDING' && !user.isCompleted);

      return searchMatch && roleMatch && statusMatch;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Statistics counts
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'ADMIN').length;
    const completed = users.filter(u => u.isCompleted).length;
    return { total, admins, completed };
  }, [users]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <UsersIcon className="h-7 w-7 text-blue-600" />
            User Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View, manage, and assign roles for registered system users.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:text-blue-600 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <UsersIcon className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admins</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.admins}</p>
          </div>
          <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed Profiles</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completed}</p>
          </div>
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, company..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span>Role:</span>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MODERATOR">MODERATOR</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchUsers} className="text-red-600 font-bold text-xs underline">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Loading user data...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredUsers.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm space-y-3">
          <div className="h-12 w-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <UsersIcon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Users Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No users match your current search and filter criteria.'
              : 'There are currently no users in the database.'}
          </p>
        </div>
      )}

      {/* Users List / Cards */}
      {!loading && filteredUsers.length > 0 && (
        <div className="space-y-3">
          {filteredUsers.map(user => {
            const busy = !!actionLoading[user.id];
            const initial = (user.name || user.email).charAt(0).toUpperCase();

            return (
              <div
                key={user.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* User Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-100 shrink-0">
                    {initial}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-gray-900 text-base truncate">
                        {user.name || '(No name set)'}
                      </span>

                      {/* Status Badge */}
                      {user.isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-mono text-gray-500 truncate">{user.email}</p>

                    {/* Companies preview */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      <span>
                        Companies: {user.companies?.map(c => c.name).join(', ') || <span className="italic text-gray-400">None</span>}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls & Actions */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                  {/* Role dropdown selector */}
                  <div className="relative">
                    <select
                      value={user.role}
                      disabled={busy}
                      onChange={e => handleChangeRole(user, e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="MODERATOR">MODERATOR</option>
                    </select>
                  </div>

                  {/* Toggle Completed */}
                  <button
                    onClick={() => handleToggleCompleted(user)}
                    disabled={busy}
                    className={`inline-flex items-center gap-1.5 border px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      user.isCompleted
                        ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
                    } disabled:opacity-50`}
                    title={user.isCompleted ? 'Mark Profile Incomplete' : 'Mark Profile Completed'}
                  >
                    {user.isCompleted ? <UserX className="h-3.5 w-3.5 text-gray-400" /> : <UserCheck className="h-3.5 w-3.5" />}
                    <span>{user.isCompleted ? 'Incomplete' : 'Complete'}</span>
                  </button>

                  {/* View Details Page Link */}
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Link>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(user.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 p-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                    title="Delete User"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {busy && <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-1" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

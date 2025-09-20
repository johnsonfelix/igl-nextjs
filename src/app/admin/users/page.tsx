// /app/admin/users/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, UserCheck, UserX, Edit3 } from 'lucide-react';

type Company = {
  id: string;
  // add other fields you want to show
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
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

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
    const ok = confirm('Delete this user? This action cannot be undone.');
    if (!ok) return;
    setUserLoading(id, true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      // optimistic update
      setUsers(prev => prev.filter(u => u.id !== id));
      alert('User deleted');
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
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      const updated: User = await res.json();
      setUsers(prev => prev.map(u => (u.id === id ? updated : u)));
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setUserLoading(id, false);
    }
  }

  async function handleChangeRole(user: User) {
    const newRole = prompt('Enter new role (e.g., USER, ADMIN):', user.role);
    if (newRole === null) return; // cancelled
    const trimmed = newRole.trim();
    if (!trimmed) return;
    setUserLoading(user.id, true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: trimmed }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      const updated: User = await res.json();
      setUsers(prev => prev.map(u => (u.id === user.id ? updated : u)));
      alert('Role updated');
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setUserLoading(user.id, false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users</h1>
          <button
            onClick={fetchUsers}
            className="rounded bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
          >
            Refresh
          </button>
        </div>

        {loading && <div className="p-6 bg-white rounded shadow text-center">Loading users...</div>}
        {error && <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>}

        {!loading && users.length === 0 && <div className="p-6 bg-white rounded shadow text-center">No users found.</div>}

        <div className="space-y-4">
          {users.map(user => {
            const busy = !!actionLoading[user.id];
            return (
              <div key={user.id} className="flex items-center justify-between gap-4 bg-white p-4 rounded shadow">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="font-semibold">{user.name ?? '(No name)'}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="ml-4 px-2 py-1 rounded text-xs font-medium bg-gray-100">{user.role}</div>
                    {user.isCompleted && <div className="ml-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">Completed</div>}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Companies: {user.companies?.map(c => c.name).join(', ') || '—'}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/user/${user.id}`} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm">
                      <Edit3 size={14} /> View
                    </Link>

                    <button
                      onClick={() => handleToggleCompleted(user)}
                      disabled={busy}
                      className={`inline-flex items-center gap-2 rounded px-3 py-2 text-sm border ${user.isCompleted ? 'bg-white' : 'bg-teal-600 text-white'}`}
                    >
                      {user.isCompleted ? <UserX size={14} /> : <UserCheck size={14} />}
                      {user.isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleChangeRole(user)}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm"
                    >
                      Change Role
                    </button>

                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded bg-red-50 text-red-700 border px-3 py-2 text-sm"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>

                  {busy && <div className="text-xs text-gray-500 mt-1">Working...</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

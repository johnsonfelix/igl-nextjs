'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, Building2, Phone, Mail, User, Loader2, Eye, EyeOff, Key } from 'lucide-react';
import { createBranch, updateBranch, deleteBranch } from './actions';
import { toast } from 'react-hot-toast';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  user?: { email: string } | null;
  createdAt: Date;
}

interface BranchManagerProps {
  companyId: string;
  initialBranches: Branch[];
}

export default function BranchManager({ companyId, initialBranches }: BranchManagerProps) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    contactPerson: '',
    phone: '',
    email: '',
    password: ''
  });

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        address: branch.address || '',
        city: branch.city || '',
        country: branch.country || '',
        contactPerson: branch.contactPerson || '',
        phone: branch.phone || '',
        email: branch.email || branch.user?.email || '',
        password: ''
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        country: '',
        contactPerson: '',
        phone: '',
        email: '',
        password: ''
      });
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast.error('Email is required for branch login');
      return;
    }
    if (!editingBranch && !formData.password) {
      toast.error('Password is required for new branches');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: any = { ...formData };
      // Don't send empty password on edit (means no change)
      if (editingBranch && !submitData.password) {
        delete submitData.password;
      }

      if (editingBranch) {
        const result = await updateBranch(editingBranch.id, submitData);
        if (result.success && result.data) {
          toast.success('Branch updated successfully');
          setBranches(prev => prev.map(b => b.id === editingBranch.id ? result.data as Branch : b));
          handleCloseModal();
        } else {
          toast.error(result.error || 'Failed to update branch');
        }
      } else {
        const result = await createBranch(companyId, submitData);
        if (result.success && result.data) {
          toast.success('Branch created successfully');
          setBranches(prev => [result.data as Branch, ...prev]);
          handleCloseModal();
        } else {
          toast.error(result.error || 'Failed to create branch');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch? The associated login account will also be removed.')) return;
    
    try {
      const result = await deleteBranch(id);
      if (result.success) {
        toast.success('Branch deleted');
        setBranches(prev => prev.filter(b => b.id !== id));
      } else {
        toast.error(result.error || 'Failed to delete branch');
      }
    } catch (error) {
      toast.error('Failed to delete branch');
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#004aad] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#003a8c] transition-colors shadow-sm shadow-blue-900/20"
        >
          <Plus className="w-5 h-5" />
          Add New Branch
        </button>
      </div>

      {branches.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <Building2 className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Branches Yet</h3>
          <p className="text-gray-500 max-w-md">You haven't added any regional branches or offices. Click the button above to add your first branch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#004aad]/10 text-[#004aad]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{branch.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(branch)}
                      className="p-2 text-gray-400 hover:text-[#004aad] hover:bg-[#004aad]/5 rounded-lg transition-colors"
                      title="Edit Branch"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(branch.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Branch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  {(branch.city || branch.country || branch.address) && (
                    <div className="flex items-start gap-3 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-none" />
                      <div>
                        {branch.address && <div className="line-clamp-1">{branch.address}</div>}
                        <div className="line-clamp-1">
                          {[branch.city, branch.country].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {branch.contactPerson && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <User className="w-4 h-4 text-gray-400 flex-none" />
                      <span className="line-clamp-1">{branch.contactPerson}</span>
                    </div>
                  )}

                  {(branch.email || branch.user?.email) && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400 flex-none" />
                      <span className="line-clamp-1">{branch.email || branch.user?.email}</span>
                    </div>
                  )}

                  {branch.phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400 flex-none" />
                      <span className="line-clamp-1">{branch.phone}</span>
                    </div>
                  )}
                </div>

                {/* Login badge */}
                {branch.user && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg font-medium">
                      <Key className="w-3.5 h-3.5" />
                      Login enabled • {branch.user.email}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="branch-form" onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-[#004aad] focus:ring-[#004aad] text-sm py-2.5 px-3"
                    placeholder="e.g. New York Office"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full rounded-xl border-gray-200 shadow-sm focus:border-[#004aad] focus:ring-[#004aad] text-sm py-2.5 px-3"
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 shadow-sm focus:border-[#004aad] focus:ring-[#004aad] text-sm py-2.5 px-3"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full rounded-xl border-gray-200 shadow-sm focus:border-[#004aad] focus:ring-[#004aad] text-sm py-2.5 px-3"
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-4">Contact Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                      <input
                        type="text"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-[#004aad] focus:ring-[#004aad] text-sm py-2.5 px-3"
                        placeholder="Name of contact"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-[#004aad] focus:ring-[#004aad] text-sm py-2.5 px-3"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                </div>

                {/* Login Credentials Section */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="w-4 h-4 text-[#004aad]" />
                    <h4 className="text-sm font-bold text-gray-900">Login Credentials</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">This email and password will be used by the branch to log in to the dashboard.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Login Email *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full rounded-xl border-gray-200 shadow-sm focus:border-[#004aad] focus:ring-[#004aad] text-sm py-2.5 px-3"
                        placeholder="branch@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {editingBranch ? 'New Password (leave blank to keep current)' : 'Password *'}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required={!editingBranch}
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full rounded-xl border-gray-200 shadow-sm focus:border-[#004aad] focus:ring-[#004aad] text-sm py-2.5 px-3 pr-10"
                          placeholder={editingBranch ? '••••••••' : 'Enter password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 flex-none">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="branch-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#004aad] text-white font-bold hover:bg-[#003a8c] transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingBranch ? 'Save Changes' : 'Create Branch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

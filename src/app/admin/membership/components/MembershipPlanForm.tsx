'use client';

import { useState, useEffect } from 'react';
import { MembershipPlan } from '@prisma/client';

type FormProps = {
  plan: MembershipPlan | null;
  onSuccess: (plan: MembershipPlan, action: 'create' | 'update') => void;
  onCancel: () => void;
};

export default function MembershipPlanForm({ plan, onSuccess, onCancel }: FormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [features, setFeatures] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = Boolean(plan);

  useEffect(() => {
    if (isEditing && plan) {
      setName(plan.name);
      setPrice(plan.price);
      setFeatures((plan.features || []).join('\n'));
    } else {
      setName('');
      setSlug('');
      setPrice('');
      setFeatures('');
    }
  }, [plan, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      price: Number(price || 0),
      features: features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    };

    const api = isEditing ? `/api/admin/membership-plans/${plan!.id}` : '/api/admin/membership-plans';
    const method = isEditing ? 'PATCH' : 'POST';

    try {
      const res = await fetch(api, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save');
      }

      // Expect server to return the created/updated plan JSON
      const savedPlan: MembershipPlan = await res.json();

      onSuccess(savedPlan, isEditing ? 'update' : 'create');
    } catch (error) {
      console.error('Save plan error:', error);
      alert('An error occurred saving the plan. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{isEditing ? 'Edit Plan' : 'Create New Plan'}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Subscription Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border p-2 rounded-md"
                placeholder="e.g. Pro, Basic, Enterprise"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full border p-2 rounded-md"
                placeholder="unique-slug"
                
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Price (USD)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border p-2 rounded-md"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Feature count</label>
              <div className="mt-2 text-sm text-gray-600">{features.split('\n').filter(Boolean).length} features</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Features (one per line)</label>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              className="w-full border p-2 rounded-md"
              rows={6}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-60"
            >
              {isLoading ? (isEditing ? 'Updating...' : 'Creating...') : isEditing ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

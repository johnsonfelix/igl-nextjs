'use client';

import { useState } from 'react';
import { MembershipPlan } from '@prisma/client';
import { useRouter } from 'next/navigation';
import MembershipPlanForm from './MembershipPlanForm';
import { ShieldCheck } from 'lucide-react';

type Props = {
  initialPlans: MembershipPlan[];
};

export default function MembershipManager({ initialPlans }: Props) {
  const [plans, setPlans] = useState<MembershipPlan[]>(initialPlans || []);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);
  const router = useRouter();

  const handleFormSuccess = (plan: MembershipPlan, action: 'create' | 'update') => {
    if (action === 'create') {
      setPlans((p) => [plan, ...p]);
    } else {
      setPlans((p) => p.map((x) => (x.id === plan.id ? plan : x)));
    }
    setIsFormOpen(false);
    setEditingPlan(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      setLoadingDelete(id);
      const res = await fetch(`/api/admin/membership-plans/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete');
      }

      setPlans((p) => p.filter((pl) => pl.id !== id));
    } catch (err) {
      console.error('Delete error', err);
      alert('Failed to delete plan. See console.');
    } finally {
      setLoadingDelete(null);
    }
  };

  const openCreateForm = () => {
    setEditingPlan(null);
    setIsFormOpen(true);
  };

  const openEditForm = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Membership Plans</h1>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          + Create New Plan
        </button>
      </div>

      {isFormOpen && (
        <MembershipPlanForm
          plan={editingPlan}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingPlan(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between transition hover:shadow-xl"
            aria-labelledby={`plan-${plan.id}`}
          >
            {/* Order Summary styled header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <ShieldCheck className="h-10 w-10 text-blue-500 mr-4" />
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">{plan.name}</p>
                    <p className="text-sm text-gray-500">Billed Annually</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500">Subscription</div>
                  <div className="text-2xl font-bold text-gray-800">${Number(plan.price).toFixed(2)}</div>
                </div>
              </div>

              <div className="mb-4 space-y-2">
                {plan.paymentProtection && (
                  <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded inline-block">
                    🛡️ {plan.paymentProtection}
                  </div>
                )}
                <br />
                {plan.discountPercentage !== undefined && plan.discountPercentage !== null && plan.discountPercentage > 0 && (
                  <div className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded inline-block">
                    🏷️ {plan.discountPercentage}% Discount
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 pt-2 text-gray-600">
                {(plan.features || []).length === 0 ? (
                  <li className="text-sm italic text-gray-400">No features listed</li>
                ) : (
                  plan.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center text-sm">
                      <ShieldCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Footer with total and actions */}
            <div className="mt-6 pt-6 border-t flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-800">Total</p>
                <p className="text-xl font-bold text-blue-600">${Number(plan.price).toFixed(2)}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditForm(plan)}
                  className="px-3 py-2 rounded-md bg-amber-500 text-white text-sm hover:bg-amber-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="px-3 py-2 rounded-md bg-red-500 text-white text-sm hover:bg-red-600 disabled:opacity-60"
                  disabled={loadingDelete === plan.id}
                >
                  {loadingDelete === plan.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

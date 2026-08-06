'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

export default function UserLegacyRedirect({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  useEffect(() => {
    if (resolvedParams.id) {
      router.replace(`/admin/users/${resolvedParams.id}`);
    }
  }, [resolvedParams.id, router]);

  return (
    <div className="flex items-center justify-center min-h-[300px] text-gray-500 text-sm">
      Redirecting to user details...
    </div>
  );
}

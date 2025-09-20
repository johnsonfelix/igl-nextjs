"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

// Define the shape of the form data, now including 'name'
interface CompanyProfileData {
  name: string; // Added user's name
  website: string;
  established: string; // Will be sent as a string, converted to Date on the server
  size: string;
  about: string;
  address: string;
}

export default function CompleteProfileButton({ companyId }: { companyId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<CompanyProfileData>({
    name: "", // Initial state for name
    website: "",
    established: "",
    size: "",
    about: "",
    address: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, companyId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "An unknown error occurred.");
      }

      // On success: close modal and refresh the page to update the UI
      setIsModalOpen(false);
      router.refresh(); // This re-fetches data on the server component

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Complete Profile
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto bg-gray-500 bg-opacity-75">
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-6 m-4 w-full max-w-2xl">
              <h3 className="text-xl font-semibold mb-4">Complete Your Company Profile</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* NEW: Input field for the user's name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                
                {/* Existing form fields */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">Company Website</label>
                  <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://yourcompany.com" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                </div>
                <div>
                  <label htmlFor="established" className="block text-sm font-medium text-gray-700">Date Established</label>
                  <input type="date" name="established" value={formData.established} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                </div>
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700">Company Size (e.g., 1-10 employees)</label>
                  <input type="text" name="size" value={formData.size} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Full Office Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
                </div>
                <div>
                  <label htmlFor="about" className="block text-sm font-medium text-gray-700">About Your Company</label>
                  <textarea name="about" rows={4} value={formData.about} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    Cancel
                  </button>
                  <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                    {isLoading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

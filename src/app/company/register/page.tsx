'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterCompanyPage() {
  const [form, setForm] = useState({
    name: '',
    sector: 'Freight Forwarder',
    city: '',
    country: '',
    email: '',
    password: '',
    agreeToTerms: false
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value, type } = e.target;

  if (type === 'checkbox') {
    const target = e.target as HTMLInputElement;
    setForm((prev) => ({ ...prev, [name]: target.checked }));
  } else {
    setForm((prev) => ({ ...prev, [name]: value }));
  }
};

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/company/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (res.ok) {
      // Redirect or show success
      router.push('/login') // or company profile page
    } else {
      setError(data.error || 'Something went wrong')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto my-10 px-4">
      <h2 className="text-2xl font-bold mb-4">Register Your Company</h2>
      <form onSubmit={onSubmit} className="space-y-4">

        <input
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          placeholder="Company Name"
          className="w-full border px-3 py-2 rounded"
        />

        <select
          name="sector"
          value={form.sector}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="Freight Forwarder">Freight Forwarder</option>
          <option value="Vendor">Vendor</option>
          <option value="Trader">Trader</option>
        </select>

        <div className="flex gap-4">
          <input
            name="city"
            required
            value={form.city}
            onChange={handleChange}
            placeholder="City"
            className="w-1/2 border px-3 py-2 rounded"
          />
          <input
            name="country"
            required
            value={form.country}
            onChange={handleChange}
            placeholder="Country"
            className="w-1/2 border px-3 py-2 rounded"
          />
        </div>

        <input
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full border px-3 py-2 rounded"
        />

        <input
          name="password"
          type="password"
          required
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full border px-3 py-2 rounded"
        />

        <div className="flex items-center">
          <input
            name="agreeToTerms"
            type="checkbox"
            checked={form.agreeToTerms}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="agreeToTerms" className="text-sm">
            I agree to the <a href="/terms" className="text-blue-600 underline">user agreement</a>
          </label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.agreeToTerms}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  )
}

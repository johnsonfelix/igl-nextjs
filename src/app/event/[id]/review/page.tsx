'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';

export default function EventReviewPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [reviewerName, setReviewerName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // 1. Conference Arrangements
  const [arrangementsRating, setArrangementsRating] = useState('');
  const [arrangementsComments, setArrangementsComments] = useState('');

  // 2. Meetings
  const [meetingsRating, setMeetingsRating] = useState('');
  const [meetingsComments, setMeetingsComments] = useState('');

  // 3. Areas We Need to Develop
  const [areasToDevelop, setAreasToDevelop] = useState<string[]>([]);
  const [areasOther, setAreasOther] = useState('');

  // 4. How will you Contribute
  const [contributeWays, setContributeWays] = useState<string[]>([]);
  const [contributeOther, setContributeOther] = useState('');
  const [contributeComments, setContributeComments] = useState('');

  // 5. Overall Satisfaction
  const [overallSatisfaction, setOverallSatisfaction] = useState('');

  // 6. Membership You prefer
  const [preferredMembership, setPreferredMembership] = useState('');

  // 7. Suggestions & Recommendations
  const [suggestions, setSuggestions] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const toggleArray = (arr: string[], setArr: (val: string[]) => void, item: string) => {
    if (arr.includes(item)) setArr(arr.filter(i => i !== item));
    else setArr([...arr, item]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const satMap: Record<string, number> = {
      'Very Satisfied': 5,
      'Satisfied': 4,
      'Neutral': 3,
      'Dissatisfied': 2,
    };
    const rating = satMap[overallSatisfaction] || 5;

    const feedbackObj = {
      format: 'v2', // identifier
      arrangementsRating,
      arrangementsComments,
      meetingsRating,
      meetingsComments,
      areasToDevelop,
      areasOther,
      contributeWays,
      contributeOther,
      contributeComments,
      overallSatisfaction,
      preferredMembership,
      suggestions
    };

    try {
      const res = await fetch(`/api/events/${eventId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName,
          companyName,
          rating,
          feedback: JSON.stringify(feedbackObj)
        })
      });
      if (res.ok) {
        setIsSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit review');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100"
        >
          <CheckCircle2 size={64} className="mx-auto text-[#5da765] mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-8">Your review has been successfully submitted. We appreciate your feedback.</p>
          <Link href={`/event/${eventId}`}>
            <Button className="w-full h-12 bg-gray-900 text-white hover:bg-black font-semibold rounded-xl">
              Back to Event Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Helper for Radio buttons
  const RadioItem = ({ name, value, current, onChange }: any) => (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-100">
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)} className="w-5 h-5 text-[#5da765] focus:ring-[#5da765]" />
      <span className="text-gray-700">{value}</span>
    </label>
  );

  // Helper for Checkbox buttons
  const CheckboxItem = ({ label, isChecked, onChange }: any) => (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-100">
      <input type="checkbox" checked={isChecked} onChange={onChange} className="w-5 h-5 rounded text-[#5da765] focus:ring-[#5da765]" />
      <span className="text-gray-700">{label}</span>
    </label>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href={`/event/${eventId}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors mb-8">
          <ChevronLeft size={16} className="mr-1" /> Back to Event
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#004AAD] to-[#5da765] p-10 text-white">
            <h1 className="text-4xl font-extrabold mb-2 text-white/95">Event Feedback</h1>
            <p className="text-white/80 text-lg">We value your input. Please take a moment to share your experience.</p>
          </div>

          <div className="p-10">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div>
                  <Label className="block text-sm font-bold text-gray-700 mb-2">Your Name *</Label>
                  <Input
                    required value={reviewerName} onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Enter your full name" className="h-12 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-bold text-gray-700 mb-2">Company Name *</Label>
                  <Input
                    required value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter completely" className="h-12 rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* 1. Conference Arrangements */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">1️⃣ Conference Arrangements</h3>
                <p className="text-gray-600 font-medium">How would you rate the overall conference arrangements (venue, logistics, hospitality, etc.)?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Excellent', 'Good', 'Average', 'Poor'].map(val => (
                    <RadioItem key={val} name="q1" value={val} current={arrangementsRating} onChange={setArrangementsRating} />
                  ))}
                </div>
                <div>
                  <Label className="text-sm font-bold text-gray-700 flex items-center gap-1"><span role="img" aria-label="comment">💬</span> Comments:</Label>
                  <Textarea className="mt-2 rounded-xl" rows={3} value={arrangementsComments} onChange={e => setArrangementsComments(e.target.value)} />
                </div>
              </div>

              {/* 2. Meetings */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">2️⃣ Meetings</h3>
                <p className="text-gray-600 font-medium">How would you rate the quality and usefulness of the 1-2-1 meetings & Interactions?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Excellent', 'Good', 'Average', 'Poor'].map(val => (
                    <RadioItem key={val} name="q2" value={val} current={meetingsRating} onChange={setMeetingsRating} />
                  ))}
                </div>
                <div>
                  <Label className="text-sm font-bold text-gray-700 flex items-center gap-1"><span role="img" aria-label="comment">💬</span> Comments:</Label>
                  <Textarea className="mt-2 rounded-xl" rows={3} value={meetingsComments} onChange={e => setMeetingsComments(e.target.value)} />
                </div>
              </div>

              {/* 3. Areas We Need to Develop */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">3️⃣ Areas We Need to Develop</h3>
                <p className="text-gray-600 font-medium">Which areas should we focus on improving?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['Number of Participants', 'Country/Region Coverage', 'Quality of Meetings', 'Event Duration', 'Venue Selection'].map(label => (
                    <CheckboxItem key={label} label={label} isChecked={areasToDevelop.includes(label)} onChange={() => toggleArray(areasToDevelop, setAreasToDevelop, label)} />
                  ))}
                </div>
                <div className="flex items-center gap-3 pl-2 mt-2">
                  <span className="text-gray-700 font-medium whitespace-nowrap">Other:</span>
                  <Input value={areasOther} onChange={e => setAreasOther(e.target.value)} className="h-10 rounded-lg max-w-sm" placeholder="Specify here..." />
                </div>
              </div>

              {/* 4. How will you Contribute */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">4️⃣ How will you Contribute</h3>
                <p className="text-gray-600 font-medium">How can you contribute to the network’s growth?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['Referrals', 'Sponsorships', 'Promotions / Marketing Support', 'Sharing Business Leads', 'Active Participation in Meetings'].map(label => (
                    <CheckboxItem key={label} label={label} isChecked={contributeWays.includes(label)} onChange={() => toggleArray(contributeWays, setContributeWays, label)} />
                  ))}
                </div>
                <div className="flex items-center gap-3 pl-2 mt-2 border-b border-dashed border-gray-200 pb-4 mb-2">
                  <span className="text-gray-700 font-medium whitespace-nowrap">Other:</span>
                  <Input value={contributeOther} onChange={e => setContributeOther(e.target.value)} className="h-10 rounded-lg max-w-sm" placeholder="Specify here..." />
                </div>
                <div>
                  <Label className="text-sm font-bold text-gray-700 flex items-center gap-1"><span role="img" aria-label="comment">💬</span> Comments:</Label>
                  <Textarea className="mt-2 rounded-xl" rows={3} value={contributeComments} onChange={e => setContributeComments(e.target.value)} />
                </div>
              </div>

              {/* 5. Overall Satisfaction */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">5️⃣ Overall Satisfaction</h3>
                <p className="text-gray-600 font-medium">How satisfied are you with the IGLA Conference overall?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'].map(val => (
                    <RadioItem key={val} name="q5" value={val} current={overallSatisfaction} onChange={setOverallSatisfaction} />
                  ))}
                </div>
              </div>

              {/* 6. Membership You prefer */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">6️⃣ Membership You prefer</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Silver', 'Gold', 'Platinum', 'Diamond'].map(val => (
                    <RadioItem key={val} name="q6" value={val} current={preferredMembership} onChange={setPreferredMembership} />
                  ))}
                </div>
              </div>

              {/* 7. Suggestions & Recommendations */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2">7️⃣ Suggestions & Recommendations</h3>
                <p className="text-gray-600 font-medium">What improvements or suggestions would you like to share for future conferences?</p>
                <Textarea className="mt-2 rounded-xl" rows={6} value={suggestions} onChange={e => setSuggestions(e.target.value)} placeholder="Enter your detailed feedback here..." />
              </div>

              <div className="pt-8">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-gradient-to-r from-[#004AAD] to-[#5da765] hover:opacity-90 text-white font-extrabold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {isSubmitting ? 'Sumitting Review...' : 'SUBMIT'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

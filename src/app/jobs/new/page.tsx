'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import { createBrowserClient } from '@supabase/ssr';

export default function AddJobPage() {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState('Wishlist');
  const [statusLink, setStatusLink] = useState('');
  const [portal, setPortal] = useState('');
  const [appliedOn, setAppliedOn] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');

  const { data: session } = useSession();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newJob = {
      id: uuidv4(),
      title,
      company,
      status,
      status_link: statusLink || null,
      deadline: deadline || null,
      applied_on: appliedOn || null,
      portal: portal || null,
      notes: notes || null,
      had_interview: status === 'Interview' || status === 'Offer' || status === 'Rejected',  
      had_offer: status === 'Offer',  
      created_at: new Date().toISOString(),
    };

    const guestSession = JSON.parse(localStorage.getItem('guestSession') || 'null');
    const isGuest = session?.user?.email === 'guest@example.com' || guestSession?.user?.email === 'guest@example.com';

    if (isGuest) {
      const guestJobs = JSON.parse(sessionStorage.getItem('guestJobs') || '[]');
      guestJobs.unshift(newJob);
      sessionStorage.setItem('guestJobs', JSON.stringify(guestJobs));
    } else {
      const userId = session?.user?.id;

      if (!userId) {
        console.error('Authenticated user not found.');
        return;
      }

     const { error: supabaseError } = await supabase
          .from('jobs')
          .insert([{
            ...newJob,
            user_id: userId,
          }])
          .select();

      if (supabaseError) {
        // Unique constraint violation
        if (supabaseError.code === '23505') {
          console.error('Duplicate job entry:', supabaseError.message);
          alert('You have already applied for the same role at this company.');
          return;
        }
        console.error('Error inserting job to Supabase:', supabaseError.message);
        console.error('Error details:', {
        message: supabaseError.message,
        details: supabaseError.details,
        hint: supabaseError.hint,
        code: supabaseError.code
      });
      alert(`Failed to save job: ${supabaseError.message}`);
        return;
      }
    }

    router.push('/jobs');
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-xl bg-white p-6 rounded-xl shadow-md text-gray-900">
        <h1 className="text-2xl font-bold mb-4 text-center">Add New Job</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
        
          <div>
            <label className="block font-medium mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border px-3 py-2 rounded-md"
              placeholder="e.g. Product Manager"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Company <span className="text-red-500">*</span>
            </label>
            <input
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="w-full border px-3 py-2 rounded-md"
              placeholder="e.g. Google"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Status</label>
            <select
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            >
              <option>Wishlist</option>
              <option>Applied</option>
              <option>Interview</option>
              <option>Offer</option>
              <option>Rejected</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Portal</label>
            <select
              name="portal"
              value={portal}
              onChange={(e) => setPortal(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            >
              <option value="">Select Portal</option>
              <option value="Internshala">Internshala</option>
              <option value="Naukri">Naukri</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Glassdoor">Glassdoor</option>
              <option value="Instahyre">Instahyre</option>
              <option value="Indeed">Indeed</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Status Link</label>
            <input
              type="url"
              name="statusLink"
              value={statusLink}
              onChange={(e) => setStatusLink(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              placeholder="e.g. https://careers.google.com/jobs/12345"
            />
            <p className="text-sm text-gray-500 mt-1">
              Add a link to the job posting, application portal, or status page
            </p>
          </div>

          <div>
            <label className="block font-medium mb-1">Applied On</label>
            <input
              type="date"
              name="appliedOn"
              value={appliedOn}
              onChange={(e) => setAppliedOn(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Deadline (If applicable)</label>
            <input
              type="date"
              name="deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Notes</label>
            <textarea
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
              placeholder="Add any notes about this application (e.g., referral name, interview feedback, etc.)"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md w-full cursor-pointer"
          >
            Save Job
          </button>

          <button
            type="button"
            onClick={() => router.push('/jobs')}
            className="mb-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md w-full hover:bg-gray-300 cursor-pointer"
          >
            Cancel
          </button>
        </form>
      </div>
    </main>
  );
}
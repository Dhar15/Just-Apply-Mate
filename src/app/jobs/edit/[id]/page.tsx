'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Job } from '@/types/job';
import { useSession } from 'next-auth/react';
import { supabase } from '@lib/supabase';

export default function EditJobPage() {
  const router = useRouter();
  const { id } = useParams();
  const { data: session } = useSession();

  const [job, setJob] = useState<Job>({
    id: '',
    title: '',
    company: '',
    status: 'Wishlist',
    status_link: '',
    portal: '',
    applied_on: '',
    notes: '',
    deadline: '',
  });

  const guestSession = JSON.parse(localStorage.getItem('guestSession') || 'null');
  const isGuest = session?.user?.email === 'guest@example.com' || guestSession?.user?.email === 'guest@example.com';

  // Load the job
  useEffect(() => {
    const loadJob = async () => {
      if (!id || typeof id !== 'string') {
        console.error('Job ID missing or invalid');
        return;
      }

      if (isGuest) {
        const guestJobs: Job[] = JSON.parse(sessionStorage.getItem('guestJobs') || '[]');
        const found = guestJobs.find((j) => j.id === id);
        if (found) setJob(found);
        else console.error('Job not found for guest');
      } else {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching job:', error.message);
        } else {
          setJob(data);
        }
      }
    };

    loadJob();
  }, [id, isGuest]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setJob({ ...job, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isGuest) {
      const guestJobs: Job[] = JSON.parse(sessionStorage.getItem('guestJobs') || '[]');
      const updatedJobs = guestJobs.map((j) => (j.id === job.id ? job : j));
      sessionStorage.setItem('guestJobs', JSON.stringify(updatedJobs));
    } else {
      const { error } = await supabase
        .from('jobs')
        .update({
          title: job.title,
          company: job.company,
          status: job.status,
          status_link: job.status_link || null,
          portal: job.portal || null,
          applied_on: job.applied_on || null,
          notes: job.notes || null,
          deadline: job.deadline || null,
          had_interview: job.had_interview,  
          had_offer: job.had_offer,          
        })
        .eq('id', job.id);

      if (error) {
        console.error('Error updating job:', error.message);
        return;
      }
    }

    router.push('/jobs');
  };

  if (!job.id) return <p>Loading...</p>;

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-lg bg-white p-6 rounded-xl shadow-md text-gray-900">
        <h1 className="text-2xl font-bold mb-4 text-center">Edit Job</h1>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={job.title}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter job title"
              required
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={job.company}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter company name"
              required
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={job.status}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="Wishlist">Wishlist</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label htmlFor="portal" className="block text-sm font-medium text-gray-700">
              Portal
            </label>
            <select
              id="portal"
              name="portal"
              value={job.portal || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
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
            <label htmlFor="status_link" className="block text-sm font-medium text-gray-700">
              Status Link
            </label>
            <input
              type="url"
              id="status_link"
              name="status_link"
              value={job.status_link || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g. https://careers.google.com/jobs/12345"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add a link to the job posting, application portal, or status page
            </p>
          </div>

           <div>
            <label htmlFor="applied_on" className="block text-sm font-medium text-gray-700">
              Applied On
            </label>
            <input
              type="date"
              id="applied_on"
              name="applied_on"
              value={job.applied_on || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
              Deadline
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={job.deadline}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

           <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={job.notes || ''}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Add any notes about this application"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-md w-full cursor-pointer"
          >
            Save Changes
          </button>

          <button
            onClick={() => router.push('/jobs')}
            type="button"
            className="mb-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md w-full hover:bg-gray-300 cursor-pointer"
          >
            Cancel
          </button>
        </form>
      </div>
    </main>
  );
}
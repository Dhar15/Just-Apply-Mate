'use client';

import { useEffect, useState } from 'react';
import { Job } from '@/types/job';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useSession } from 'next-auth/react';
import {supabase} from '@lib/supabase';

const STATUS_COLORS: Record<string, string> = {
  Wishlist: '#60a5fa',
  Applied: '#fb923c',
  Interview: '#facc15',
  Offer: '#4ade80',
  Rejected: '#f87171',
};

type TimeView = 'month' | 'week' | 'day';

export default function JobStatsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [timeView, setTimeView] = useState<TimeView>('month');
  const { data: session, status } = useSession();

  useEffect(() => {
    async function fetchJobs() {
      const guestSession = JSON.parse(localStorage.getItem('guestSession') || 'null');
      const isGuest = session?.user?.email === 'guest@example.com' || guestSession?.user?.email === 'guest@example.com';

      console.log(isGuest);

      if (isGuest) {
          // Guest user: read from storage (local/session)
          const stored = sessionStorage.getItem('guestJobs');
          const parsed = stored ? JSON.parse(stored) : [];
          setJobs(parsed);
        } else if (session?.user?.id) {
          console.log(session?.user?.email);
          // Authenticated user: fetch from Supabase
          const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', session.user.id);

          if (error) {
            console.error('Error fetching jobs from Supabase:', error);
            setJobs([]);
          } else {
            setJobs(data || []);
          }
        } else {
          // No session info yet
          setJobs([]);
        }
      }

      if (status === 'authenticated' || status === 'unauthenticated') {
        fetchJobs();
      }
  }, [status, session]);

  const statusCounts = jobs.reduce((acc: Record<string, number>, job: Job) => {
    const status = job.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  const totalJobs = jobs.length;
  const appliedStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
  const applied = jobs.filter((job) => appliedStatuses.includes(job.status)).length;
  const offers = statusCounts['Offer'] || 0;
  const rejected = statusCounts['Rejected'] || 0;

  const hadInterview = jobs.filter(job => 
    job.had_interview || job.status === 'Interview'
  ).length;

  const hadOffer = jobs.filter(job => 
    job.had_offer || job.status === 'Offer'  
  ).length;

  const gotResponse = hadInterview + hadOffer;
  const responseRate = applied ? ((gotResponse / applied) * 100).toFixed(1) : '0';
  const conversionRate = applied ? ((offers / applied) * 100).toFixed(1) : '0';
  const rejectionRate = applied ? ((rejected / applied) * 100).toFixed(1) : '0';

  const upcoming = jobs
    .filter((job) => job.status === 'Interview' && job.deadline && !isNaN(new Date(job.deadline).getTime()) && new Date(job.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];

  // Prepare time-based data
  const getTimeData = () => {
    const jobsWithDates = jobs.filter((job) => job.applied_on && job.status !== 'Wishlist');
    
    if (timeView === 'month') {
      const monthCounts: Record<string, number> = {};
      jobsWithDates.forEach((job) => {
        const date = new Date(job.applied_on!);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });
      return Object.entries(monthCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
          name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          applications: count,
        }));
    } else if (timeView === 'week') {
      const weekCounts: Record<string, number> = {};
      jobsWithDates.forEach((job) => {
        const date = new Date(job.applied_on!);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
      });
      return Object.entries(weekCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, count]) => ({
          name: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          applications: count,
        }));
    } else {
      const dayCounts: Record<string, number> = {};
      jobsWithDates.forEach((job) => {
        const date = new Date(job.applied_on!);
        const dayKey = date.toISOString().split('T')[0];
        dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;
      });
      return Object.entries(dayCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30) // Last 30 days
        .map(([day, count]) => ({
          name: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          applications: count,
        }));
    }
  };

  const timeData = getTimeData();

  return (
    <div className="min-h-screen bg-gray-100 pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-6">
          📊 Job Statistics
        </h1>

        {/* Quick Metrics - Full Width */}
        <div className="bg-white p-6 rounded-xl shadow mb-8">
          <h2 className="text-lg font-bold text-gray-800 text-center mb-4">Quick Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-gray-600 text-sm">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-900">{totalJobs}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Applications</p>
              <p className="text-3xl font-bold text-gray-600">{applied}</p>
            </div>
            <div className="group relative">
              <p className="text-gray-600 text-sm flex items-center justify-center gap-1">Response Rate</p>
              <p className="text-3xl font-bold text-blue-600">{responseRate}%</p>
              <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10">
                <div className="font-semibold mb-1">Response Rate:</div>
                <div>Percentage of applications that ever resulted in interviews or offers. Rejections are tracked separately.</div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 transform rotate-45"></div>
              </div>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Conversion</p>
              <p className="text-3xl font-bold text-green-600">{conversionRate}%</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Rejection</p>
              <p className="text-3xl font-bold text-red-500">{rejectionRate}%</p>
            </div>
          </div>
        </div>

        {/* Two Charts Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-2">Jobs by Status</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || '#a3a3a3'}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} jobs`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 mt-8">No job data available.</p>
            )}
          </div>

          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Applications by Time</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeView('month')}
                  className={`px-3 py-1 text-sm rounded ${
                    timeView === 'month'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setTimeView('week')}
                  className={`px-3 py-1 text-sm rounded ${
                    timeView === 'week'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeView('day')}
                  className={`px-3 py-1 text-sm rounded ${
                    timeView === 'day'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Day
                </button>
              </div>
            </div>
            {timeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timeData} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 mt-8">No application data available.</p>
            )}
          </div>
        </div>

        {/* Upcoming Deadline */}
        <div className="bg-red-100 border border-gray-200 rounded-xl p-6 text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">📅 Upcoming Interview</h2>
          {upcoming ? (
            <p className="text-gray-700">
              <strong>{upcoming.title}</strong> at <strong>{upcoming.company}</strong> is due on{' '}
              <strong>{new Date(upcoming.deadline!).toLocaleDateString()}</strong>
            </p>
          ) : (
            <p className="text-gray-500">No upcoming deadlines found.</p>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div
              key={status}
              className="bg-white rounded-xl shadow p-4 text-center border"
            >
              <h3 className="text-lg font-semibold text-gray-800">{status}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{count}</p>
            </div>
          ))}
        </div>

        {/* Pro Insight */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-blue-700 mb-2">📈 Pro Insight</h2>
          <p className="text-gray-700">
            You&apos;ve applied to <strong>{applied}</strong> job(s), scored <strong>{hadInterview}</strong> interview(s), and landed <strong>{offers}</strong> offer(s). Keep tracking your progress!
          </p>
        </div>
      </div>
    </div>
  );
}
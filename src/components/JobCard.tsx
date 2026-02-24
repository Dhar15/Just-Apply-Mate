import React from 'react';
import { Job } from '@/types/job';
import Image from 'next/image';

interface Props {
  job: Job;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

const JobCard: React.FC<Props> = ({ job, onDelete, onEdit }) => {
  const statusColors: Record<Job['status'], string> = {
    Wishlist: 'bg-blue-400',
    Applied: 'bg-orange-400',
    Interview: 'bg-yellow-400',
    Offer: 'bg-green-400',
    Rejected: 'bg-red-400',
  };

  const portalLogos: Record<string, string> = {
    Internshala: '/logos/internshala.png',
    Naukri: '/logos/naukri.png',
    LinkedIn: '/logos/linkedin.png',
    Glassdoor: '/logos/glassdoor.png',
    Instahyre: '/logos/instahyre.png',
    Indeed: '/logos/indeed.png',
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="border p-4 rounded-md shadow-md bg-white text-gray-900 relative">
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-xl font-semibold">{job.title}</h3>
        {job.notes && (
            <div className="group relative">
              <span className="text-black-500 cursor-help text-xl" title="View notes">
                &#9432;
              </span>
              <div className="invisible group-hover:visible absolute right-0 top-6 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-10">
                <div className="font-semibold mb-1">Notes:</div>
                <div className="whitespace-pre-wrap">{job.notes}</div>
                <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-800 transform rotate-45"></div>
              </div>
            </div>
          )}
      </div>

      <p className="font-medium text-gray-600">{job.company}</p>
      
      {job.applied_on && (
        <p className="text-sm text-gray-500">Applied: {formatDate(job.applied_on)}</p>
      )}
      {job.deadline && (
        <p className="text-sm text-gray-500">Deadline: {formatDate(job.deadline)}</p>
      )}

      <div className="flex items-center gap-2 mt-2">
        <div
          className={`inline-block px-4 py-1 text-sm rounded-full text-white ${statusColors[job.status] || 'bg-gray-600'}`}
        >
          {job.status}
        </div>

        {job.status_link && 
        job.status != 'Rejected' &&
         (
          <a
            href={job.status_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-1 text-sm rounded-full text-white bg-indigo-500 hover:bg-indigo-600 transition-colors"
          >
            View Status
          </a>
        )}
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          {/* Edit Button */}
          <button
            onClick={() => onEdit(job.id)}
            className="cursor-pointer text-blue-600 border border-blue-600 px-2 py-1 rounded hover:bg-blue-50 text-sm"
          >
            Edit
          </button>
          
          {/* Delete Button */}
          <button
            onClick={() => onDelete(job.id)}
            className="cursor-pointer text-red-600 border border-red-600 px-2 py-1 rounded hover:bg-red-50 text-sm"
          >
            Delete
          </button>
        </div>

      {/* Portal Logo */}
      {job.portal && portalLogos[job.portal] && (
        <div className="flex-shrink-0">
          <Image
            src={portalLogos[job.portal]}
            alt={`${job.portal} logo`}
            width={60}
            height={60}
            className="object-contain"
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default JobCard;
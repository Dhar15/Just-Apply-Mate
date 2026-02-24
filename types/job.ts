export interface Job {
  had_interview: boolean;
  had_offer: boolean;
  id: string;
  title: string;
  company: string;
  status: 'Wishlist' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  portal?: string;
  applied_on?: string;
  status_link?: string;
  notes?: string;
  deadline?: string;
}
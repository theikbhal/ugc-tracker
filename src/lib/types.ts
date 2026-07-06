export interface UGCCreator {
  id: string;
  instagram_id: string;
  instagram_link: string;
  name: string;
  notes: string;
  apps: string[];
  status: 'new' | 'contacted' | 'responded' | 'working' | 'completed' | 'rejected';
  followers: number;
  following: number;
  posts: number;
  related_creators: string[];
  created_at: string;
  updated_at: string;
}

export interface DMMessage {
  id: string;
  creator_id: string;
  message: string;
  sent_at: string;
  responded: boolean;
  responded_at: string | null;
  response_text: string | null;
  status: 'sent' | 'delivered' | 'read' | 'responded';
}

export interface App {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Settings {
  use_supabase: boolean;
  supabase_url: string;
  supabase_anon_key: string;
  use_local_storage: boolean;
  page_size: number;
}

export const DEFAULT_SETTINGS: Settings = {
  use_supabase: false,
  supabase_url: 'https://fuywzjtfspfdpctrlxtj.supabase.co',
  supabase_anon_key: 'sb_publishable_0CYJcJvLrCDUwmRh00nL3g_hDzglYbU',
  use_local_storage: true,
  page_size: 20,
};

export const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'responded', label: 'Responded', color: 'bg-green-100 text-green-800' },
  { value: 'working', label: 'Working', color: 'bg-purple-100 text-purple-800' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
] as const;

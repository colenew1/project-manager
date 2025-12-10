// Project Types
export type ProjectStatus = 'idea' | 'under_construction' | 'active' | 'paused' | 'completed' | 'archived';

export type ProjectCategory =
  | 'personal'
  | 'marketing'
  | 'sales'
  | 'customer_success'
  | 'engineering'
  | 'product'
  | 'design'
  | 'operations'
  | 'finance'
  | 'hr'
  | 'other';

export interface ProjectLink {
  id: string;
  project_id: string;
  label: string;
  url: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  notes: string | null; // Built-in notes content (markdown)
  mac_path: string | null;
  pc_path: string | null;
  github_url: string | null; // https://github.com/user/repo (viewable link)
  github_clone: string | null; // git@github.com:user/repo.git (for cloning)
  live_url: string | null; // https://myproject.vercel.app (deployed site)
  status: ProjectStatus;
  categories: ProjectCategory[]; // Multiple categories/departments
  position_x: number;
  position_y: number;
  color: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  todos?: Todo[];
  links?: ProjectLink[]; // Additional custom links
}

// Tag Types
export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_tech_stack: boolean;
  created_at: string;
}

export interface ProjectTag {
  id: string;
  project_id: string;
  tag_id: string;
}

// Todo Types
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TodoPriority;
  is_completed: boolean;
  recurrence_rule: string | null;
  parent_id: string | null;
  completed_at: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  projects?: Project[];
}

export interface TodoProject {
  id: string;
  todo_id: string;
  project_id: string;
}

// Project Relations (for visual map)
export type RelationType = 'depends_on' | 'related_to' | 'extends' | 'uses';

export interface ProjectRelation {
  id: string;
  source_id: string;
  target_id: string;
  relation_type: RelationType;
  label: string | null;
  created_at: string;
}

// Keychain Types (API Keys & Secrets)
export type KeyEnvironment = 'production' | 'development' | 'staging';

// A single key-value pair within a keychain group
export interface KeychainEntry {
  id: string;
  group_id: string;
  label: string;             // e.g., "SUPABASE_URL", "SUPABASE_ANON_KEY"
  value: string;             // The actual value
  created_at: string;
}

// A group of related keys (e.g., all Supabase keys for a project)
export interface KeychainGroup {
  id: string;
  user_id: string;
  name: string;              // e.g., "Supabase - Project Manager"
  service: string | null;    // e.g., "Supabase", "Stripe", "AWS"
  environment: KeyEnvironment;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  entries?: KeychainEntry[]; // The key-value pairs in this group
  projects?: Project[];      // Linked projects (many-to-many)
}

// Junction table for keychain_group <-> projects
export interface KeychainGroupProject {
  id: string;
  group_id: string;
  project_id: string;
}

// Legacy type for backwards compatibility
export interface KeychainItem {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  key_value: string;
  service: string | null;
  environment: KeyEnvironment;
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  project?: Project;
}

// User Profile
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  default_mac_path: string;
  default_pc_path: string;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

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
  is_favorite: boolean;
  folder_id: string | null;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  todos?: Todo[];
  links?: ProjectLink[]; // Additional custom links
  folder?: ProjectFolder;
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
  source_handle: string | null;
  target_handle: string | null;
  created_at: string;
}

// Note Types
export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  projects?: Project[];
}

export interface NoteProject {
  id: string;
  note_id: string;
  project_id: string;
}

// Project Folder
export interface ProjectFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  position: number;
  created_at: string;
  updated_at: string;
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

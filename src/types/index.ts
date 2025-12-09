// Project Types
export type ProjectStatus = 'idea' | 'active' | 'paused' | 'completed' | 'archived';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  notes_url: string | null;
  mac_path: string | null;
  pc_path: string | null;
  github_url: string | null;
  status: ProjectStatus;
  position_x: number;
  position_y: number;
  color: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  todos?: Todo[];
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

// Snippet Types
export interface Snippet {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  language: string;
  code: string;
  description: string | null;
  is_favorite: boolean;
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

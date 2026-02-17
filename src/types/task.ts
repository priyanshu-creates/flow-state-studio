export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

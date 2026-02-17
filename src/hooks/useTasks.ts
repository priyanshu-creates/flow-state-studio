import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { toast } from '@/hooks/use-toast';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true });
    if (error) {
      toast({ title: 'Error loading tasks', description: error.message, variant: 'destructive' });
    } else {
      setTasks((data as Task[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (task: { title: string; description?: string; status?: TaskStatus; priority?: TaskPriority; category?: string; due_date?: string }) => {
    if (!user) return;
    const maxPos = tasks.filter(t => t.status === (task.status || 'todo')).length;
    const { error } = await supabase.from('tasks').insert({
      ...task,
      user_id: user.id,
      position: maxPos,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
    });
    if (error) toast({ title: 'Error adding task', description: error.message, variant: 'destructive' });
    else fetchTasks();
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) toast({ title: 'Error updating task', description: error.message, variant: 'destructive' });
    else fetchTasks();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) toast({ title: 'Error deleting task', description: error.message, variant: 'destructive' });
    else fetchTasks();
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    const maxPos = tasks.filter(t => t.status === newStatus).length;
    await updateTask(taskId, { status: newStatus, position: maxPos });
  };

  return { tasks, loading, addTask, updateTask, deleteTask, moveTask, refetch: fetchTasks };
}

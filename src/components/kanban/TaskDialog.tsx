import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task, TaskStatus, TaskPriority } from '@/types/task';

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; description?: string; status?: TaskStatus; priority?: TaskPriority; category?: string; due_date?: string }) => void;
  task?: Task | null;
  defaultStatus?: TaskStatus;
}

export const TaskDialog = ({ open, onClose, onSave, task, defaultStatus = 'todo' }: TaskDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setCategory(task.category || '');
      setDueDate(task.due_date || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('medium');
      setCategory('');
      setDueDate('');
    }
  }, [task, defaultStatus, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, status, priority, category, due_date: dueDate || undefined });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="glass-card border-glass-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} required className="bg-secondary/50 border-glass-border" />
          <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="bg-secondary/50 border-glass-border resize-none" rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Select value={status} onValueChange={v => setStatus(v as TaskStatus)}>
              <SelectTrigger className="bg-secondary/50 border-glass-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}>
              <SelectTrigger className="bg-secondary/50 border-glass-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="bg-secondary/50 border-glass-border" />
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-secondary/50 border-glass-border" />
          </div>
          <Button type="submit" className="w-full glow-sm">{task ? 'Update' : 'Add Task'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

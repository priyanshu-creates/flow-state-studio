import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { Calendar, Trash2, Edit2, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const priorityColors: Record<string, string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

export const TaskCard = ({ task, onEdit, onDelete }: TaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "glass-surface p-4 group cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-2xl ring-2 ring-primary/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div {...attributes} {...listeners} className="mt-1 text-muted-foreground/40 hover:text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("w-2 h-2 rounded-full", priorityColors[task.priority])} />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {task.priority}
            </span>
            {task.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                {task.category}
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-foreground mb-1 truncate">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{task.description}</p>
          )}
          <div className="flex items-center justify-between">
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'MMM d')}
              </div>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                <Edit2 className="h-3 w-3" />
              </button>
              <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

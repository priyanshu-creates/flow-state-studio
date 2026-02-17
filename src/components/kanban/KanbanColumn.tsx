import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const columnGlowMap: Record<string, string> = {
  todo: 'column-glow-todo',
  in_progress: 'column-glow-progress',
  done: 'column-glow-done',
  completed: 'column-glow-completed',
};

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
  onAdd: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const KanbanColumn = ({ status, title, tasks, color, onAdd, onEdit, onDelete }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className={cn("flex-1 min-w-[280px] max-w-[340px]")}>
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className={cn("w-3 h-3 rounded-full shadow-sm", color)} />
          <h3 className="font-display font-semibold text-foreground text-sm">{title}</h3>
          <span className={cn(
            "text-xs font-medium px-2.5 py-0.5 rounded-full",
            status === 'completed' ? 'bg-column-completed/20 text-column-completed' : 'bg-secondary/60 text-muted-foreground'
          )}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      
      <div
        ref={setNodeRef}
        className={cn(
          "space-y-3 min-h-[200px] p-2 rounded-xl transition-all duration-200 border border-transparent",
          isOver && status === 'completed' && "bg-column-completed/10 ring-2 ring-column-completed/40 border-column-completed/20",
          isOver && status !== 'completed' && "bg-primary/5 ring-1 ring-primary/20",
          !isOver && columnGlowMap[status]
        )}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
              {status === 'completed' && <CheckCircle2 className="h-8 w-8 mb-2" />}
              <p className="text-xs">Drop tasks here</p>
            </div>
          )}
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

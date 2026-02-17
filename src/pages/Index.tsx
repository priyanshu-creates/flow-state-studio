import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center px-4 border-b border-glass-border">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </header>
          <KanbanBoard />
        </div>
        <ChatPanel />
      </div>
    </SidebarProvider>
  );
};

export default Index;

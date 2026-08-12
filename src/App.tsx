import { useState } from 'react';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginView } from './views/LoginView';
import { MenuView } from './views/MenuView';
import { AdminView } from './views/AdminView';
import { Loader2, Coffee } from 'lucide-react';
import type { UserRole } from './types';

function AppContent() {
  const { user, loading } = useAuth();
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'cashier'>('admin');

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-espresso-700 text-cream-50">
          <Coffee className="h-6 w-6" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-espresso-400" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (user.role === 'admin' && adminViewMode === 'admin') {
    return <AdminView onSwitchToCashier={() => setAdminViewMode('cashier')} />;
  }

  const canSwitchToAdmin: UserRole | null = user.role === 'admin' ? 'admin' : null;
  return <MenuView onSwitchToAdmin={canSwitchToAdmin ? () => setAdminViewMode('admin') : undefined} />;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

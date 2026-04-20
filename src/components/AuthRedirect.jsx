import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function AuthRedirect() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "linear-gradient(145deg, #0f0f1a 0%, #1a1228 50%, #0d1117 100%)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin"></div>
        <span className="text-white/40 text-xs font-medium tracking-widest uppercase">ContaCena ERP</span>
      </div>
    </div>
  );
}
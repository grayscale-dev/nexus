import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Legacy route redirect for /Support
 * Redirects to canonical board-scoped route if context exists
 */
export default function SupportLegacy() {
  const navigate = useNavigate();

  useEffect(() => {
    const workspace = sessionStorage.getItem('selectedWorkspace');
    
    if (workspace) {
      const ws = JSON.parse(workspace);
      navigate(`/board/${ws.slug}/support`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return null;
}
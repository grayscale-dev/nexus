import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * BoardContext Model
 * 
 * Provides centralized board state and permissions for all board pages.
 * Single source of truth that replaces scattered auth checks.
 */

const BoardContext = createContext(null);

export function useBoardContext() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within BoardProvider');
  }
  return context;
}

export function BoardProvider({ children }) {
  const [state, setState] = useState({
    // Core state
    workspace: null,
    user: null,
    role: 'viewer',
    isPublicAccess: false,
    loading: true,
    
    // Computed permissions
    permissions: {
      canView: false,
      canCreateFeedback: false,
      canCreateRoadmap: false,
      canCreateSupport: false,
      canComment: false,
      canManageSettings: false,
      canModerateContent: false,
      isStaff: false,
      isAdmin: false
    },
    
    // Messages for UI
    messages: {
      loginPrompt: null,
      accessDenied: null
    }
  });

  useEffect(() => {
    loadBoardContext();
  }, []);

  const loadBoardContext = async () => {
    try {
      // Read context from sessionStorage (set by Board router)
      const storedWorkspace = sessionStorage.getItem('selectedWorkspace');
      const storedRole = sessionStorage.getItem('currentRole');
      const storedIsPublicAccess = sessionStorage.getItem('isPublicAccess') === 'true';

      if (!storedWorkspace) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      const workspace = JSON.parse(storedWorkspace);
      const role = storedRole || 'viewer';

      // Try to get user
      let user = null;
      try {
        user = await base44.auth.me();
      } catch (error) {
        // Not authenticated
      }

      // Compute permissions based on role and access type
      const permissions = computePermissions(role, storedIsPublicAccess, user);
      
      // Compute UI messages
      const messages = computeMessages(storedIsPublicAccess, user, role, permissions);

      setState({
        workspace,
        user,
        role,
        isPublicAccess: storedIsPublicAccess,
        loading: false,
        permissions,
        messages
      });

    } catch (error) {
      console.error('Failed to load board context:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const refresh = () => {
    loadBoardContext();
  };

  return (
    <BoardContext.Provider value={{ ...state, refresh }}>
      {children}
    </BoardContext.Provider>
  );
}

/**
 * Compute permissions based on role and access type
 */
function computePermissions(role, isPublicAccess, user) {
  // Public access (unauthenticated or no role) - read-only
  if (isPublicAccess) {
    return {
      canView: true,
      canCreateFeedback: false,
      canCreateRoadmap: false,
      canCreateSupport: false,
      canComment: false,
      canManageSettings: false,
      canModerateContent: false,
      isStaff: false,
      isAdmin: false
    };
  }

  // Authenticated with role
  const isAdmin = role === 'admin';
  const isStaff = role === 'admin' || role === 'support';
  const isContributor = role === 'contributor' || isStaff;

  return {
    canView: true,
    canCreateFeedback: isContributor,
    canCreateRoadmap: isStaff,
    canCreateSupport: isContributor,
    canComment: isContributor,
    canManageSettings: isAdmin,
    canModerateContent: isStaff,
    isStaff,
    isAdmin
  };
}

/**
 * Compute UI messages for various states
 */
function computeMessages(isPublicAccess, user, role, permissions) {
  // Unauthenticated public viewer
  if (isPublicAccess && !user) {
    return {
      loginPrompt: 'Login to contribute feedback and interact with this board',
      accessDenied: null
    };
  }

  // Authenticated but public access (no role)
  if (isPublicAccess && user) {
    return {
      loginPrompt: null,
      accessDenied: "You don't have permission to contribute to this board. Contact the admin to request access."
    };
  }

  // Full access
  return {
    loginPrompt: null,
    accessDenied: null
  };
}
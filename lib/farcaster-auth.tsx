"use client";

import { createContext, useContext, useEffect, useState } from "react";

type FarcasterUser = {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  bio?: string;
};

type FarcasterContextType = {
  user: FarcasterUser | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const FarcasterContext = createContext<FarcasterContextType | null>(null);

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we're in a Farcaster MiniApp environment
    checkFarcasterAuth();
  }, []);

  async function checkFarcasterAuth() {
    setIsLoading(true);
    
    try {
      // Check if user is already authenticated via Farcaster
      // This would typically involve checking the Farcaster SDK or iframe context
      
      // For now, we'll simulate this - in production you'd use the actual Farcaster SDK
      const urlParams = new URLSearchParams(window.location.search);
      const fid = urlParams.get('fid');
      const username = urlParams.get('username');
      
      if (fid && username) {
        setUser({
          fid: parseInt(fid),
          username,
          displayName: username,
          pfpUrl: `https://api.dicebear.com/8.x/avataaars/svg?seed=${username}`
        });
      }
    } catch (error) {
      console.error("Farcaster auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const login = () => {
    // In production, this would trigger Farcaster's auth flow
    // For now, we'll create a demo user
    const demoUser: FarcasterUser = {
      fid: Math.floor(Math.random() * 10000),
      username: `user${Math.floor(Math.random() * 1000)}`,
      displayName: `Demo User`,
      pfpUrl: `https://api.dicebear.com/8.x/avataaars/svg?seed=${Date.now()}`
    };
    setUser(demoUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <FarcasterContext.Provider 
      value={{ 
        user, 
        isLoading, 
        login, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (!context) {
    throw new Error("useFarcaster must be used within a FarcasterProvider");
  }
  return context;
}
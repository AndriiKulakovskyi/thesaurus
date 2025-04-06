import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "researcher" | "manager" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data
const mockUsers: Record<string, { password: string; user: User }> = {
  "researcher@example.com": {
    password: "Password123",
    user: {
      id: "1",
      email: "researcher@example.com",
      name: "Alex Researcher",
      role: "researcher",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=researcher",
    },
  },
  "manager@example.com": {
    password: "Password123",
    user: {
      id: "2",
      email: "manager@example.com",
      name: "Sam Manager",
      role: "manager",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=manager",
    },
  },
  "admin@example.com": {
    password: "Password123",
    user: {
      id: "3",
      email: "admin@example.com",
      name: "Jordan Admin",
      role: "admin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const lowerEmail = email.toLowerCase();
    const userRecord = mockUsers[lowerEmail];

    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user);
      localStorage.setItem("user", JSON.stringify(userRecord.user));
      setIsLoading(false);
      return true;
    } else {
      setError("Invalid email or password");
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

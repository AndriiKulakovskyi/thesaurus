import React from "react";
import { useAuth, UserRole } from "../../contexts/AuthContext";

interface RoleBasedAccessProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that conditionally renders its children based on the user's role.
 *
 * @param allowedRoles - Array of roles that are allowed to see the children
 * @param children - Content to show if the user has an allowed role
 * @param fallback - Optional content to show if the user doesn't have an allowed role
 */
const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  allowedRoles,
  children,
  fallback = null,
}) => {
  const { user } = useAuth();

  // If no user is logged in, show fallback
  if (!user) {
    return <>{fallback}</>;
  }

  // If user's role is in the allowed roles, show children
  if (allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  // Otherwise show fallback
  return <>{fallback}</>;
};

export default RoleBasedAccess;

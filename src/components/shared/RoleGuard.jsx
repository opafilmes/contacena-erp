import React from "react";
import { useOutletContext, Navigate } from "react-router-dom";

/**
 * Blocks access if the user's role is in the `blockedRoles` array.
 * Redirects to "/" if blocked.
 */
export default function RoleGuard({ blockedRoles = [], children }) {
  const { usuario } = useOutletContext();
  const role = usuario?.role || "Admin";

  if (blockedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
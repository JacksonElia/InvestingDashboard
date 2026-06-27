import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // TODO: Add authentication check here
  // For now, just render children
  // When auth is implemented:
  // - Check if user is authenticated
  // - If not, redirect to /login
  // - If yes, render children

  return <>{children}</>;
}

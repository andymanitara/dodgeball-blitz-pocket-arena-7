import React, { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HomePage } from '@/pages/HomePage';
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
]);
export default function App() {
  useEffect(() => {
    // Inject PWA Manifest
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.json';
    document.head.appendChild(link);
    // Inject Theme Color
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = '#0f172a';
    document.head.appendChild(meta);
  }, []);
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster />
      </TooltipProvider>
    </ErrorBoundary>
  );
}
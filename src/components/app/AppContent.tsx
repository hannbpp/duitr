
// Main app content wrapper that handles routes and navbar positioning
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import Navbar from '@/components/layout/Navbar';
import { AppRoutes } from './AppRoutes';
import { useNavbarVisibility } from '@/hooks/useNavbarVisibility';

export const AppContent: React.FC = () => {
  const shouldShowNavbar = useNavbarVisibility();

  return (
    <>
      <AppRoutes />
      {shouldShowNavbar && <Navbar />}
      <Toaster />
      <Sonner />
    </>
  );
};

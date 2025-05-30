
import { useState, useEffect } from 'react';

export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  currentBreakpoint: BreakpointSize;
  width: number;
  height: number;
}

const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    currentBreakpoint: 'lg',
    width: 1024,
    height: 768
  });

  useEffect(() => {
    const updateResponsiveState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      let currentBreakpoint: BreakpointSize = 'xs';
      
      if (width >= BREAKPOINTS['2xl']) currentBreakpoint = '2xl';
      else if (width >= BREAKPOINTS.xl) currentBreakpoint = 'xl';
      else if (width >= BREAKPOINTS.lg) currentBreakpoint = 'lg';
      else if (width >= BREAKPOINTS.md) currentBreakpoint = 'md';
      else if (width >= BREAKPOINTS.sm) currentBreakpoint = 'sm';
      else currentBreakpoint = 'xs';

      const isMobile = width < BREAKPOINTS.md;
      const isTablet = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
      const isDesktop = width >= BREAKPOINTS.lg;

      setState({
        isMobile,
        isTablet,
        isDesktop,
        currentBreakpoint,
        width,
        height
      });
    };

    updateResponsiveState();
    window.addEventListener('resize', updateResponsiveState);
    
    return () => window.removeEventListener('resize', updateResponsiveState);
  }, []);

  return state;
}

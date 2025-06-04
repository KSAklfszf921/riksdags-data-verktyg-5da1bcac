
import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'riksdag-member-favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.warn('Failed to load favorites from localStorage:', error);
    }
  }, []);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.warn('Failed to save favorites to localStorage:', error);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((memberId: string) => {
    setFavorites(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  }, []);

  const addFavorite = useCallback((memberId: string) => {
    setFavorites(prev => {
      if (!prev.includes(memberId)) {
        return [...prev, memberId];
      }
      return prev;
    });
  }, []);

  const removeFavorite = useCallback((memberId: string) => {
    setFavorites(prev => prev.filter(id => id !== memberId));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const isFavorite = useCallback((memberId: string) => {
    return favorites.includes(memberId);
  }, [favorites]);

  return {
    favorites,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    isFavorite
  };
};

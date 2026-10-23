import { useState } from 'react';
import { ViewType } from '../types';

interface HistoryEntry {
  view: ViewType;
  playlistId: string | null;
  artistName: string | null;
}

/**
 * Single Responsibility Principle (SRP):
 * Hook responsable exclusivamente del historial y estado de navegación.
 */
export function useNavigation(initialView: ViewType = 'home') {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const navigateTo = (view: ViewType, idOrName?: string) => {
    setHistory((prev) => [
      ...prev,
      { view: currentView, playlistId: selectedPlaylistId, artistName: selectedArtistName }
    ]);
    setCurrentView(view);
    if (view === 'playlist') {
      setSelectedPlaylistId(idOrName || null);
      setSelectedArtistName(null);
    } else if (view === 'artist') {
      setSelectedArtistName(idOrName || null);
      setSelectedPlaylistId(null);
    } else {
      setSelectedPlaylistId(null);
      setSelectedArtistName(null);
    }
  };

  const navigateBack = () => {
    if (history.length === 0) {
      setCurrentView('home');
      setSelectedPlaylistId(null);
      setSelectedArtistName(null);
      return;
    }
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentView(last.view);
    setSelectedPlaylistId(last.playlistId);
    setSelectedArtistName(last.artistName);
  };

  return {
    currentView,
    selectedPlaylistId,
    selectedArtistName,
    navigateTo,
    navigateBack,
    canGoBack: history.length > 0
  };
}

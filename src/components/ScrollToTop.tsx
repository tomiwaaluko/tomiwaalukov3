import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollPageTop } from '../utils/scrollPageTop';

/**
 * Restores scroll position to the top on route changes (incl. browser back/forward).
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollPageTop();
  }, [pathname]);

  return null;
}

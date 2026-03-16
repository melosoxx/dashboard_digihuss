import { useRef, useCallback, type TouchEvent } from "react";

interface UseSwipeNavigationOptions {
  items: string[];
  active: string;
  onChangeAction: (value: string) => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Hook that provides touch event handlers for horizontal swipe navigation
 * between a list of items (e.g. tab values).
 */
export function useSwipeNavigation({
  items,
  active,
  onChangeAction,
  threshold = 50,
  enabled = true,
}: UseSwipeNavigationOptions) {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    [enabled]
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const deltaX = e.changedTouches[0].clientX - startX.current;
      const deltaY = e.changedTouches[0].clientY - startY.current;

      // Only trigger if horizontal movement is dominant
      if (Math.abs(deltaX) < threshold || Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }

      const currentIndex = items.indexOf(active);
      if (currentIndex === -1) return;

      if (deltaX < 0 && currentIndex < items.length - 1) {
        // Swipe left → next
        onChangeAction(items[currentIndex + 1]);
      } else if (deltaX > 0 && currentIndex > 0) {
        // Swipe right → previous
        onChangeAction(items[currentIndex - 1]);
      }
    },
    [enabled, items, active, onChangeAction, threshold]
  );

  return { onTouchStart, onTouchEnd };
}

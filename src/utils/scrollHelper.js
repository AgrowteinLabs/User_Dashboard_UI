/**
 * Delegates wheel scrolling to the window when an internal scrollable element
 * has reached its top or bottom boundary, preventing scroll-latching/trapping.
 *
 * @param {React.WheelEvent<HTMLElement>} e
 */
export const handleBoundaryWheel = (e) => {
  const el = e.currentTarget;
  if (!el) return;
  const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
  const isAtTop = el.scrollTop <= 0;

  if ((isAtBottom && e.deltaY > 0) || (isAtTop && e.deltaY < 0)) {
    window.scrollBy({ top: e.deltaY, behavior: "auto" });
  }
};

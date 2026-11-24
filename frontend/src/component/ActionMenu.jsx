import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_HEIGHT = 140; // approximate, used to decide whether to open upward

/** Three-dot (⋮) button that opens a View / Edit / Delete menu. */
const ActionMenu = ({ label, onView, onEdit, onDelete }) => {
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState(null); // null = closed

  const toggle = () => {
    if (position) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const fitsBelow = rect.bottom + MENU_HEIGHT < window.innerHeight;
    setPosition(
      fitsBelow
        ? { top: rect.bottom + 4, right }
        : { bottom: window.innerHeight - rect.top + 4, right },
    );
  };

  // Close on outside click, Escape, scroll or resize
  useEffect(() => {
    if (!position) return;
    const close = () => setPosition(null);
    const onPointer = (e) => {
      if (menuRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    menuRef.current?.querySelector("button")?.focus();
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position]);

  const run = (action) => () => {
    setPosition(null);
    action();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="menu-trigger"
        aria-label={`Actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        onClick={toggle}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>

      {position &&
        createPortal(
          <div ref={menuRef} className="menu" role="menu" style={position}>
            <button type="button" role="menuitem" className="menu-item" onClick={run(onView)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              View
            </button>
            <button type="button" role="menuitem" className="menu-item" onClick={run(onEdit)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Edit
            </button>
            <div className="menu-sep" />
            <button type="button" role="menuitem" className="menu-item danger" onClick={run(onDelete)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
              Delete
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

export default ActionMenu;

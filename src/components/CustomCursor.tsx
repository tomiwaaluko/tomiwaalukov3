import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  // --- Touch Device Detection ---
  // We'll use state to track if the device is touch-capable.
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // This effect checks for a touch-first device using a media query.
    // It runs only once when the component mounts.
    const mediaQuery = window.matchMedia('(pointer: coarse)');

    const determineTouchDevice = () => {
      if (mediaQuery.matches) {
        setIsTouchDevice(true);
      }
    };

    determineTouchDevice();
  }, []);
  // -----------------------------


  // --- Cursor Animation Logic ---
  useEffect(() => {
    // If it's a touch device, we stop here and do nothing.
    if (isTouchDevice) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;

    if (!cursor || !follower) return;

    // Keep centering in GSAP so x/y tweens do not clobber translate(-50%,-50%) (jagged scale).
    gsap.set([cursor, follower], {
      xPercent: -50,
      yPercent: -50,
      transformOrigin: '50% 50%',
    });

    const moveCursor = (e: MouseEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.06,
        overwrite: 'auto',
      });
      gsap.to(follower, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.18,
        overwrite: 'auto',
      });
    };

    const handleMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'a') {
        gsap.to(cursor, { backgroundColor: '#C4A572', scale: 5.8, duration: 0.2 });
        gsap.to(follower, { borderColor: '#8B7355', scale: 1.5, duration: 0.2 });
        target.style.color = '#A68B5B';
      } else {
        gsap.to(cursor, { scale: 5.8, duration: 0.3 });
        gsap.to(follower, { scale: 1.5, duration: 0.3 });
      }
    };

    const handleMouseLeave = (e: Event) => {
      const target = e.target as HTMLElement;
      gsap.to(cursor, { backgroundColor: '', scale: 1, duration: 0.2 });
      gsap.to(follower, { borderColor: '', scale: 1, duration: 0.2 });
      if (target.tagName.toLowerCase() === 'a') {
        target.style.color = '';
      }
    };

    const handleTextEnter = () => {
      gsap.to(cursor, { scale: 19.5, duration: 0.3 });
      gsap.to(follower, { scale: 5, duration: 0.3 });
    };

    const handleTextLeave = () => {
      gsap.to([cursor, follower], { scale: 1, duration: 0.3 });
    };

    // Add all event listeners
    document.addEventListener('mousemove', moveCursor);
    const interactiveElements = document.querySelectorAll('a, button, [data-cursor="pointer"]');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });
    const textElements = document.querySelectorAll('h1, h2, h3');
    textElements.forEach((el) => {
      el.addEventListener('mouseenter', handleTextEnter);
      el.addEventListener('mouseleave', handleTextLeave);
    });

    return () => {
      gsap.killTweensOf([cursor, follower]);
      document.removeEventListener('mousemove', moveCursor);
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
      textElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleTextEnter);
        el.removeEventListener('mouseleave', handleTextLeave);
      });
    };
  }, [isTouchDevice]); // This effect depends on the device type.


  // --- Component Render ---
  // This is the key: if it's a touch device, we render nothing.
  if (isTouchDevice) {
    return null;
  }

  // Otherwise, we render the cursor elements for desktop.
  return (
    <>
      <div
        ref={cursorRef}
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-2 w-2 rounded-full bg-gray-700 mix-blend-difference dark:bg-gray-100"
      />
      <div
        ref={followerRef}
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-8 w-8 rounded-full border border-gray-700 mix-blend-difference dark:border-gray-100"
      />
    </>
  );
};

export default CustomCursor;
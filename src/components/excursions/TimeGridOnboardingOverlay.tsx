import React, { useEffect, useRef, useState } from 'react';

interface TimeGridOnboardingOverlayProps {
  onClose: () => void;
}

const highlightRows = [2, 3, 4, 5];
const animationInterval = 500; // ms per step
const totalSteps = highlightRows.length;

const TimeGridOnboardingOverlay: React.FC<TimeGridOnboardingOverlayProps> = ({ onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev + 1) % (totalSteps + 1));
    }, animationInterval);
    return () => clearInterval(interval);
  }, []);

  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  // Mouse position for each step
  const mousePositions = highlightRows.map(row => ({
    left: 56,
    top: 48 + (row - 2) * 20,
  }));
  const mouseVisible = step > 0 && step <= totalSteps;
  const mousePos = mouseVisible ? mousePositions[step - 1] : mousePositions[0];

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative bg-white rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none"
          aria-label="Close onboarding"
        >
          ×
        </button>
        {/* Instructional text */}
        <div className="mb-6 text-center text-lg font-medium text-gray-700">
          Click and drag to select your reservation time
        </div>
        {/* Animation area */}
        <div className="relative w-64 h-48 flex items-center justify-center">
          {/* SVG grid */}
          <svg width="256" height="192" className="absolute left-0 top-0">
            {/* Draw 5 columns x 8 rows */}
            {[...Array(8)].map((_, row) =>
              [...Array(5)].map((_, col) => (
                <rect
                  key={`cell-${row}-${col}`}
                  x={col * 48 + 8}
                  y={row * 20 + 8}
                  width={40}
                  height={16}
                  rx={4}
                  fill="#f3f4f6"
                  stroke="#d1d5db"
                  strokeWidth={1}
                />
              ))
            )}
            {/* Animated blue highlight (rows 2-5, col 2) */}
            <g className="onboarding-highlight">
              {highlightRows.map((row, idx) => (
                <rect
                  key={`highlight-${row}`}
                  x={1 * 48 + 8}
                  y={row * 20 + 8}
                  width={40}
                  height={16}
                  rx={4}
                  fill="#2563eb"
                  opacity={step > idx ? 0.7 : 0}
                  style={{ transition: 'opacity 0.3s' }}
                />
              ))}
            </g>
          </svg>
          {/* Animated mouse icon */}
          {mouseVisible && (
            <div
              className="absolute transition-all duration-300"
              style={{ left: mousePos.left, top: mousePos.top, pointerEvents: 'none' }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32">
                <ellipse cx="16" cy="20" rx="8" ry="10" fill="#fff" stroke="#888" strokeWidth="2" />
                <rect x="14" y="10" width="4" height="8" rx="2" fill="#bbb" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeGridOnboardingOverlay; 
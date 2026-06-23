import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import type { ContentType, ContentTypeConfig } from '../lib/qr-formatters';
import { CONTENT_TYPES } from '../lib/qr-formatters';

interface TypeSelectorProps {
  selected: ContentType;
  onSelect: (type: ContentType) => void;
}

export default function TypeSelector({ selected, onSelect }: TypeSelectorProps) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = () => {
    const idx = CONTENT_TYPES.findIndex((ct) => ct.id === selected);
    const tab = tabsRef.current[idx];
    const bar = barRef.current;
    if (tab && bar) {
      const barRect = bar.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      setIndicator({
        left: tabRect.left - barRect.left,
        width: tabRect.width,
      });
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [selected]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [selected]);

  return (
    <div className="tab-bar" ref={barRef} role="tablist" aria-label="Content type">
      {CONTENT_TYPES.map((ct: ContentTypeConfig, i: number) => (
        <button
          key={ct.id}
          ref={(el) => { tabsRef.current[i] = el; }}
          role="tab"
          aria-selected={selected === ct.id}
          className={`tab${selected === ct.id ? ' active' : ''}`}
          onClick={() => onSelect(ct.id)}
        >
          <span className="tab-icon" aria-hidden="true">{ct.icon}</span>
          {ct.label}
        </button>
      ))}
      <div
        className="tab-indicator"
        style={{ left: indicator.left, width: indicator.width }}
        aria-hidden="true"
      />
    </div>
  );
}

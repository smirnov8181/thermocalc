import { useState, useRef, useEffect } from 'react';
import { MapPinIcon, XIcon } from '../data/icons';

export default function RegionSelector({ regions, selectedRegion, onRegionChange }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = filter
    ? regions.filter(r => r.name.toLowerCase().includes(filter.toLowerCase()))
    : regions;

  const handleSelect = (region) => {
    onRegionChange(region);
    setOpen(false);
    setFilter('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onRegionChange(null);
  };

  return (
    <div className="region-selector" ref={ref}>
      <button
        className="region-trigger"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <MapPinIcon />
        <span className="region-trigger-text">
          {selectedRegion ? selectedRegion.name : 'Выбрать регион...'}
        </span>
        {selectedRegion && (
          <span className="region-trigger-temp mono">{selectedRegion.t5}°C</span>
        )}
        {selectedRegion ? (
          <span className="region-clear" onClick={handleClear} role="button" tabIndex={0}>
            <XIcon />
          </span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="region-dropdown">
          <input
            ref={inputRef}
            className="region-search"
            type="text"
            placeholder="Поиск города..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <div className="region-list">
            {filtered.length === 0 ? (
              <div className="region-empty">Ничего не найдено</div>
            ) : (
              filtered.map(r => (
                <button
                  key={r.name}
                  className={`region-option ${selectedRegion?.name === r.name ? 'selected' : ''}`}
                  onClick={() => handleSelect(r)}
                  type="button"
                >
                  <span>{r.name}</span>
                  <span className="mono" style={{ opacity: 0.5 }}>{r.t5}°C</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

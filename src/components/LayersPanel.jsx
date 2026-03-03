import { useRef } from 'react';
import { LayersIcon, PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '../data/icons';

export default function LayersPanel({
  layers, totalThickness,
  onOpenDialog, onRemoveLayer, onMoveLayer, onUpdateThickness, onReorderLayers,
}) {
  const dragIndexRef = useRef(null);

  const handleDragStart = (e, i) => {
    dragIndexRef.current = i;
    e.currentTarget.classList.add('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, i) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from === null || from === i) return;
    onReorderLayers(from, i);
    dragIndexRef.current = null;
  };

  const handleDragEnd = (e) => {
    dragIndexRef.current = null;
    e.currentTarget.classList.remove('dragging');
  };

  const layerCount = layers.length;
  const countWord = layerCount === 1 ? 'слой' : layerCount < 5 ? 'слоя' : 'слоёв';

  return (
    <div className="animate-in stagger-1">
      <div className="card" style={{ height: '100%' }}>
        <div className="card-header">
          <div>
            <div className="card-title"><LayersIcon /> Слои конструкции</div>
            <div className="card-description">{layerCount} {countWord} · {totalThickness.toFixed(0)} мм</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onOpenDialog}>
            <PlusIcon /> Добавить
          </button>
        </div>
        <div className="card-content">
          {layers.length === 0 ? (
            <div className="empty-state">
              <LayersIcon />
              <div className="empty-state-text">Нет слоёв</div>
              <div className="empty-state-hint">Добавьте материалы для расчёта</div>
            </div>
          ) : (
            <>
              {/* Wall visualization */}
              <div className="wall-viz" style={{ marginBottom: '1rem' }}>
                <span className="wall-side-label inside">Внутри</span>
                <span className="wall-side-label outside">Снаружи</span>
                {layers.map((l) => {
                  const pct = totalThickness > 0 ? (l.thickness / totalThickness * 100) : (100 / layers.length);
                  return (
                    <div
                      key={l.id}
                      className="wall-layer-viz"
                      style={{ width: `${Math.max(pct, 8)}%`, background: l.material.color }}
                      data-tooltip={`${l.material.name} (${l.thickness}мм)`}
                    >
                      <span className="wall-layer-viz-label">{l.material.name.split(' ')[0]}</span>
                      <span className="wall-layer-viz-thickness">{l.thickness}</span>
                    </div>
                  );
                })}
              </div>

              {/* Layers list */}
              <div className="layers-list">
                {layers.map((l, i) => (
                  <div
                    key={l.id}
                    className="layer-item"
                    draggable
                    onDragStart={e => handleDragStart(e, i)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="layer-grip"><span /><span /><span /></div>
                    <div className="layer-color" style={{ background: l.material.color }} />
                    <div className="layer-info">
                      <div className="layer-name">{l.material.name}</div>
                      <div className="layer-material">λ={l.material.lambda} · μ={l.material.mu}</div>
                    </div>
                    <div className="layer-thickness-wrap">
                      <div className="input-unit-wrap">
                        <input
                          type="number"
                          className="input input-mono"
                          style={{ width: '5rem', height: '1.875rem', textAlign: 'right' }}
                          defaultValue={l.thickness}
                          key={`${l.id}-${l.thickness}`}
                          min={1} max={1000}
                          onBlur={e => onUpdateThickness(l.id, +e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                        />
                        <span className="input-unit">мм</span>
                      </div>
                    </div>
                    <div className="layer-r mono">R={((l.thickness / 1000) / l.material.lambda).toFixed(3)}</div>
                    <div className="layer-actions">
                      {i > 0 && (
                        <button className="btn btn-ghost btn-icon-sm" onClick={() => onMoveLayer(i, -1)} aria-label="Вверх">
                          <ArrowUpIcon />
                        </button>
                      )}
                      {i < layers.length - 1 && (
                        <button className="btn btn-ghost btn-icon-sm" onClick={() => onMoveLayer(i, 1)} aria-label="Вниз">
                          <ArrowDownIcon />
                        </button>
                      )}
                      <button className="btn btn-ghost btn-icon-sm" onClick={() => onRemoveLayer(l.id)} aria-label="Удалить" style={{ color: 'var(--destructive)' }}>
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

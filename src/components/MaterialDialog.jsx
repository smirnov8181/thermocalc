import { MATERIALS } from '../data/materials';

export default function MaterialDialog({ open, onClose, onAddLayer }) {
  return (
    <div className={`dialog-overlay ${open ? 'open' : ''}`} onClick={e => {
      if (e.target.classList.contains('dialog-overlay')) onClose();
    }}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">Выбор материала</div>
        </div>
        <div className="dialog-body">
          {Object.entries(MATERIALS).map(([cat, mats]) => (
            <div className="material-category" key={cat}>
              <div className="material-category-title">{cat}</div>
              {mats.map((m, mi) => (
                <div className="material-option" key={mi} onClick={() => onAddLayer(cat, mi)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '0.625rem', height: '1.5rem', borderRadius: 2, background: m.color, flexShrink: 0 }} />
                    <span className="material-option-name">{m.name}</span>
                  </div>
                  <span className="material-option-lambda mono">λ={m.lambda}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="dialog-footer">
          <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

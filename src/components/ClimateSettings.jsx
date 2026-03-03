import { HomeIcon, SnowflakeIcon } from '../data/icons';

export default function ClimateSettings({
  tempInside, tempOutside, humidityInside, humidityOutside,
  onTempInsideChange, onTempOutsideChange,
  onHumidityInsideChange, onHumidityOutsideChange,
}) {
  return (
    <div className="section animate-in">
      <div className="card">
        <div className="card-content" style={{ paddingTop: '1.25rem' }}>
          <div className="climate-row">
            <div className="climate-block">
              <div className="climate-block-title">
                <HomeIcon /> Внутри помещения
              </div>
              <div className="temp-display" style={{ color: 'var(--destructive)' }}>
                {tempInside > 0 ? '+' : ''}{tempInside}<span className="unit">°C</span>
              </div>
              <input
                type="range" className="slider" min={10} max={30}
                value={tempInside}
                onInput={e => onTempInsideChange(+e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                <span className="input-hint">Влажность</span>
                <span className="mono" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{humidityInside}%</span>
              </div>
              <input
                type="range" className="slider" min={30} max={80}
                value={humidityInside}
                onInput={e => onHumidityInsideChange(+e.target.value)}
              />
            </div>
            <div className="climate-block">
              <div className="climate-block-title">
                <SnowflakeIcon /> Снаружи
              </div>
              <div className="temp-display" style={{ color: 'var(--brand)' }}>
                {tempOutside > 0 ? '+' : ''}{tempOutside}<span className="unit">°C</span>
              </div>
              <input
                type="range" className="slider" min={-45} max={10}
                value={tempOutside}
                onInput={e => onTempOutsideChange(+e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                <span className="input-hint">Влажность</span>
                <span className="mono" style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{humidityOutside}%</span>
              </div>
              <input
                type="range" className="slider" min={40} max={100}
                value={humidityOutside}
                onInput={e => onHumidityOutsideChange(+e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

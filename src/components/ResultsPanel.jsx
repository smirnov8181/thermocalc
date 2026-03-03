import { ThermometerIcon, DropletsIcon, ZapIcon, CheckIcon, XIcon, ChartIcon, LightbulbIcon } from '../data/icons';
import TempGraph from './TempGraph';
import OptimizePanel from './OptimizePanel';

export default function ResultsPanel({
  activeTab, onTabChange,
  Rtotal, Rrequired, meetsNorm, meetsSanitary,
  dewP, temps, innerSurfaceTemp, condensationRisk,
  qPerHour, qSeason, totalThickness,
  tempInside, tempOutside,
  isDark, layers,
  selectedRegion, regionT5, regionZht, regionTht,
  recommendations, optimizeLoading, optimizeError, onOptimize,
}) {
  return (
    <div className="animate-in stagger-2">
      <div className="card" style={{ height: '100%' }}>
        <div className="card-header">
          <div>
            <div className="card-title"><ChartIcon /> Результаты расчёта</div>
            <div className="card-description">СНиП 23-02-2003 · {selectedRegion?.name || 'Москва'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {meetsNorm && meetsSanitary
              ? <span className="badge badge-success"><CheckIcon /> Норма</span>
              : <span className="badge badge-destructive"><XIcon /> Не соответствует</span>
            }
            <button className="optimize-btn" onClick={onOptimize} disabled={optimizeLoading}>
              <LightbulbIcon /> <span>AI</span>
            </button>
          </div>
        </div>
        <div className="card-content">
          {/* AI Recommendations */}
          <OptimizePanel
            recommendations={recommendations}
            loading={optimizeLoading}
            error={optimizeError}
            onRetry={onOptimize}
          />

          {/* Tabs */}
          <div className="tabs" style={{ marginBottom: '1rem' }}>
            <button className={`tab ${activeTab === 'thermal' ? 'active' : ''}`} onClick={() => onTabChange('thermal')}>
              <ThermometerIcon /> Тепловая защита
            </button>
            <button className={`tab ${activeTab === 'moisture' ? 'active' : ''}`} onClick={() => onTabChange('moisture')}>
              <DropletsIcon /> Влага
            </button>
            <button className={`tab ${activeTab === 'losses' ? 'active' : ''}`} onClick={() => onTabChange('losses')}>
              <ZapIcon /> Потери
            </button>
          </div>

          {activeTab === 'thermal' && (
            <ThermalTab
              Rtotal={Rtotal} Rrequired={Rrequired}
              dewP={dewP} temps={temps} condensationRisk={condensationRisk}
              isDark={isDark} layers={layers}
            />
          )}
          {activeTab === 'moisture' && (
            <MoistureTab
              dewP={dewP} innerSurfaceTemp={innerSurfaceTemp}
              condensationRisk={condensationRisk}
            />
          )}
          {activeTab === 'losses' && (
            <LossesTab
              qPerHour={qPerHour} qSeason={qSeason}
              totalThickness={totalThickness}
              tempInside={tempInside} Rtotal={Rtotal}
              regionT5={regionT5} regionZht={regionZht}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ThermalTab({ Rtotal, Rrequired, dewP, temps, condensationRisk, isDark, layers }) {
  const margin = Rrequired > 0 ? ((Rtotal / Rrequired * 100) - 100).toFixed(0) : 0;
  const barWidth = Math.min(Rtotal / (Rrequired * 1.5) * 100, 100);
  const markerLeft = Math.min(Rrequired / (Rrequired * 1.5) * 100, 100);

  return (
    <>
      <div className="results-grid" style={{ marginBottom: '1rem' }}>
        <div className="result-card">
          <div className="result-label">R конструкции</div>
          <div className="result-value mono">{Rtotal.toFixed(2)}</div>
          <div className="result-unit">(м²·°C)/Вт</div>
        </div>
        <div className="result-card">
          <div className="result-label">R требуемое</div>
          <div className="result-value mono">{Rrequired.toFixed(2)}</div>
          <div className="result-unit">(м²·°C)/Вт</div>
        </div>
        <div className="result-card">
          <div className="result-label">Запас</div>
          <div className="result-value mono" style={{ color: Rtotal >= Rrequired ? 'var(--success)' : 'var(--destructive)' }}>
            {margin}%
          </div>
          <div className="result-status" style={{ color: Rtotal >= Rrequired ? 'var(--success)' : 'var(--destructive)' }}>
            {Rtotal >= Rrequired ? 'Соответствует нормам' : 'Ниже нормы'}
          </div>
        </div>
      </div>

      {/* Norma bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Сопротивление теплопередаче</span>
          <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{Rtotal.toFixed(2)} / {Rrequired.toFixed(2)}</span>
        </div>
        <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
          <div style={{
            height: '100%',
            width: `${barWidth}%`,
            background: Rtotal >= Rrequired ? 'var(--success)' : 'var(--destructive)',
            borderRadius: 4,
            transition: 'width 500ms cubic-bezier(0.25,0.4,0.25,1)',
          }} />
          <div
            style={{
              position: 'absolute', top: -2, bottom: -2,
              left: `${markerLeft}%`,
              width: 2, background: 'var(--foreground)', borderRadius: 1,
            }}
            data-tooltip={`Норма: ${Rrequired.toFixed(2)}`}
          />
        </div>
      </div>

      {/* Temperature chart */}
      <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Распределение температур
      </div>
      <TempGraph temps={temps} dewP={dewP} isDark={isDark} layers={layers} />

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ width: '1rem', height: 3, background: 'var(--destructive)', borderRadius: 2 }} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Температура</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <div style={{ width: '1rem', height: 3, background: 'var(--brand)', borderRadius: 2, opacity: 0.5 }} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--muted-foreground)' }}>Точка росы ({dewP.toFixed(1)}°C)</span>
        </div>
        {condensationRisk && <span className="badge badge-warning">Риск конденсата!</span>}
      </div>
    </>
  );
}

function MoistureTab({ dewP, innerSurfaceTemp, condensationRisk }) {
  return (
    <>
      <div className="results-grid" style={{ marginBottom: '1rem' }}>
        <div className="result-card">
          <div className="result-label">Точка росы</div>
          <div className="result-value mono">{dewP.toFixed(1)}°</div>
          <div className="result-unit">°C</div>
        </div>
        <div className="result-card">
          <div className="result-label">T внутр. пов.</div>
          <div className="result-value mono">{innerSurfaceTemp.toFixed(1)}°</div>
          <div className="result-unit">°C</div>
        </div>
        <div className="result-card">
          <div className="result-label">Конденсат</div>
          <div className="result-value" style={{ fontSize: '1rem', color: condensationRisk ? 'var(--destructive)' : 'var(--success)' }}>
            {condensationRisk ? 'Риск конденсата!' : 'Нет риска'}
          </div>
        </div>
      </div>
      <div className="card" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--muted-foreground)' }}>
          {condensationRisk
            ? <>Температура внутренней поверхности стены (<strong className="mono">{innerSurfaceTemp.toFixed(1)}°C</strong>) ниже точки росы (<strong className="mono">{dewP.toFixed(1)}°C</strong>). Это означает, что на внутренней поверхности конструкции будет образовываться конденсат. Рекомендуется увеличить толщину утеплителя.</>
            : <>Температура внутренней поверхности стены (<strong className="mono">{innerSurfaceTemp.toFixed(1)}°C</strong>) выше точки росы (<strong className="mono">{dewP.toFixed(1)}°C</strong>). Конденсат на внутренней поверхности не образуется.</>
          }
        </div>
      </div>
    </>
  );
}

function LossesTab({ qPerHour, qSeason, totalThickness, tempInside, Rtotal, regionT5, regionZht }) {
  const qCold = Rtotal > 0 ? ((tempInside - regionT5) / Rtotal).toFixed(1) : '∞';

  return (
    <>
      <div className="results-grid" style={{ marginBottom: '1rem' }}>
        <div className="result-card">
          <div className="result-label">Теплопотери</div>
          <div className="result-value mono">{qPerHour.toFixed(1)}</div>
          <div className="result-unit">Вт/м²</div>
        </div>
        <div className="result-card">
          <div className="result-label">За сезон</div>
          <div className="result-value mono">{qSeason.toFixed(1)}</div>
          <div className="result-unit">кВт·ч/м²</div>
        </div>
        <div className="result-card">
          <div className="result-label">Толщина</div>
          <div className="result-value mono">{totalThickness.toFixed(0)}</div>
          <div className="result-unit">мм</div>
        </div>
      </div>
      <div className="card" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--muted-foreground)' }}>
          При текущих параметрах конструкции и температуре самой холодной пятидневки (<strong className="mono">{regionT5}°C</strong>),
          теплопотери через 1 м² составляют <strong className="mono">{qCold} Вт</strong>.
          За отопительный сезон ({regionZht} сут.) потери составят <strong className="mono">{qSeason.toFixed(1)} кВт·ч/м²</strong>.
        </div>
      </div>
    </>
  );
}

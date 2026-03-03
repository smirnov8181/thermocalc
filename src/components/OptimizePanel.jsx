import { LightbulbIcon } from '../data/icons';

export default function OptimizePanel({ recommendations, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="optimize-panel">
        <div className="optimize-loading">
          <div className="optimize-spinner" />
          <span>Анализирую конструкцию...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="optimize-panel">
        <div className="optimize-error">
          <span>Не удалось получить рекомендации</span>
          <button className="btn btn-sm" onClick={onRetry}>Повторить</button>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="optimize-panel">
      <div className="optimize-header">
        <LightbulbIcon /> Рекомендации AI
      </div>
      {recommendations.map((rec, i) => (
        <div className="optimize-rec" key={i}>
          <div className="optimize-rec-priority" data-priority={rec.priority || 'medium'} />
          <div className="optimize-rec-content">
            <div className="optimize-rec-title">{rec.title}</div>
            <div className="optimize-rec-desc">{rec.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState, useCallback, useRef, useMemo } from 'react';
import './App.css';
import { MATERIALS, DEFAULT_LAYERS } from './data/materials';
import { REGIONS } from './data/regions';
import { calcR, calcTemperatures, dewPoint, getRequired, getSanitary } from './utils/calculations';
import Header from './components/Header';
import ClimateSettings from './components/ClimateSettings';
import LayersPanel from './components/LayersPanel';
import ResultsPanel from './components/ResultsPanel';
import MaterialDialog from './components/MaterialDialog';

export default function App() {
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [tempInside, setTempInside] = useState(20);
  const [tempOutside, setTempOutside] = useState(-10);
  const [humidityInside, setHumidityInside] = useState(55);
  const [humidityOutside, setHumidityOutside] = useState(85);
  const [activeTab, setActiveTab] = useState('thermal');
  const [isDark, setIsDark] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [optimizeLoading, setOptimizeLoading] = useState(false);
  const [optimizeError, setOptimizeError] = useState(false);
  const nextIdRef = useRef(5);

  // Derived calculations (region-aware)
  const calc = useMemo(() => {
    const { Rtotal, Rint, Rext } = calcR(layers);
    const totalThickness = layers.reduce((s, l) => s + l.thickness, 0);

    // Region-aware climate values (Moscow fallback)
    const tht = selectedRegion?.tht ?? -2.2;
    const zht = selectedRegion?.zht ?? 205;
    const t5  = selectedRegion?.t5  ?? -25;

    const gsop = (tempInside - tht) * zht;
    const Rrequired = getRequired(gsop);
    const Rsanitary = getSanitary(tempInside, t5, 1, 4, 8.7);
    const dew = dewPoint(tempInside, humidityInside);
    const temps = calcTemperatures(layers, tempInside, tempOutside);
    const innerSurfaceTemp = temps.length > 1 ? temps[1].t : tempInside;
    const meetsNorm = Rtotal >= Rrequired;
    const meetsSanitary = Rtotal >= Rsanitary;
    const condensationRisk = innerSurfaceTemp <= dew;
    const qPerHour = Rtotal > 0 ? (tempInside - tempOutside) / Rtotal : 0;
    const qSeason = Rtotal > 0 ? (tempInside - tht) / Rtotal * zht * 24 / 1000 : 0;

    return {
      Rtotal, totalThickness, Rrequired, Rsanitary,
      dewP: dew, temps, innerSurfaceTemp,
      meetsNorm, meetsSanitary, condensationRisk,
      qPerHour, qSeason,
      regionT5: t5, regionZht: zht, regionTht: tht,
    };
  }, [layers, tempInside, tempOutside, humidityInside, selectedRegion]);

  // Region handler
  const handleRegionChange = useCallback((region) => {
    setSelectedRegion(region);
    if (region) {
      setTempOutside(region.t5);
    }
    // Clear previous recommendations when region changes
    setRecommendations(null);
  }, []);

  // Override: manual slider change clears region
  const handleTempOutsideChange = useCallback((value) => {
    setTempOutside(value);
    setSelectedRegion(null);
  }, []);

  // Layer actions
  const removeLayer = useCallback((id) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    setRecommendations(null);
  }, []);

  const moveLayer = useCallback((index, dir) => {
    setLayers(prev => {
      const newIndex = index + dir;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
    setRecommendations(null);
  }, []);

  const updateThickness = useCallback((id, value) => {
    setLayers(prev => prev.map(l =>
      l.id === id ? { ...l, thickness: Math.max(1, Math.min(1000, value || 1)) } : l
    ));
    setRecommendations(null);
  }, []);

  const reorderLayers = useCallback((fromIndex, toIndex) => {
    setLayers(prev => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
    setRecommendations(null);
  }, []);

  const addLayer = useCallback((category, materialIndex) => {
    const mat = MATERIALS[category][materialIndex];
    let defaultThickness = 100;
    if (category === "Каменная кладка") defaultThickness = 375;
    if (category === "Отделка") defaultThickness = 20;
    if (category === "Прочее" && mat.name.includes("изоляция")) defaultThickness = 1;

    setLayers(prev => [...prev, {
      id: nextIdRef.current++,
      material: mat,
      thickness: defaultThickness,
    }]);
    setDialogOpen(false);
    setRecommendations(null);
  }, []);

  // AI Optimize
  const handleOptimize = useCallback(async () => {
    setOptimizeLoading(true);
    setOptimizeError(false);
    setRecommendations(null);

    const body = {
      layers: layers.map(l => ({
        name: l.material.name,
        thickness: l.thickness,
        lambda: l.material.lambda,
        mu: l.material.mu,
        density: l.material.density,
      })),
      tempInside,
      tempOutside,
      humidityInside,
      humidityOutside,
      Rtotal: calc.Rtotal,
      Rrequired: calc.Rrequired,
      dewPoint: calc.dewP,
      innerSurfaceTemp: calc.innerSurfaceTemp,
      condensationRisk: calc.condensationRisk,
      meetsNorm: calc.meetsNorm,
      qPerHour: calc.qPerHour,
      totalThickness: calc.totalThickness,
      region: selectedRegion?.name || 'Москва',
    };

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Optimize error:', err);
      setOptimizeError(true);
    } finally {
      setOptimizeLoading(false);
    }
  }, [layers, tempInside, tempOutside, humidityInside, humidityOutside, calc, selectedRegion]);

  // Theme
  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      document.documentElement.className = !prev ? 'dark' : 'light';
      return !prev;
    });
  }, []);

  // Share
  const shareCalc = useCallback(() => {
    const params = layers.map(l => `${encodeURIComponent(l.material.name)}:${l.thickness}`).join('|');
    const regionParam = selectedRegion ? `&region=${encodeURIComponent(selectedRegion.name)}` : '';
    const url = `${location.origin}${location.pathname}?layers=${params}&ti=${tempInside}&to=${tempOutside}${regionParam}`;
    navigator.clipboard?.writeText(url).then(() => {
      alert('Ссылка на расчёт скопирована!');
    });
  }, [layers, tempInside, tempOutside, selectedRegion]);

  return (
    <>
      <Header isDark={isDark} onToggleTheme={toggleTheme} onShare={shareCalc} />

      <ClimateSettings
        tempInside={tempInside}
        tempOutside={tempOutside}
        humidityInside={humidityInside}
        humidityOutside={humidityOutside}
        onTempInsideChange={setTempInside}
        onTempOutsideChange={handleTempOutsideChange}
        onHumidityInsideChange={setHumidityInside}
        onHumidityOutsideChange={setHumidityOutside}
        regions={REGIONS}
        selectedRegion={selectedRegion}
        onRegionChange={handleRegionChange}
      />

      <div className="main-grid">
        <LayersPanel
          layers={layers}
          totalThickness={calc.totalThickness}
          onOpenDialog={() => setDialogOpen(true)}
          onRemoveLayer={removeLayer}
          onMoveLayer={moveLayer}
          onUpdateThickness={updateThickness}
          onReorderLayers={reorderLayers}
        />
        <ResultsPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          Rtotal={calc.Rtotal}
          Rrequired={calc.Rrequired}
          meetsNorm={calc.meetsNorm}
          meetsSanitary={calc.meetsSanitary}
          dewP={calc.dewP}
          temps={calc.temps}
          innerSurfaceTemp={calc.innerSurfaceTemp}
          condensationRisk={calc.condensationRisk}
          qPerHour={calc.qPerHour}
          qSeason={calc.qSeason}
          totalThickness={calc.totalThickness}
          tempInside={tempInside}
          tempOutside={tempOutside}
          isDark={isDark}
          layers={layers}
          selectedRegion={selectedRegion}
          regionT5={calc.regionT5}
          regionZht={calc.regionZht}
          regionTht={calc.regionTht}
          recommendations={recommendations}
          optimizeLoading={optimizeLoading}
          optimizeError={optimizeError}
          onOptimize={handleOptimize}
        />
      </div>

      <footer className="footer">
        <span>ThermoCalc MVP · СНиП 23-02-2003</span>
        <span>Оценочный расчёт</span>
      </footer>

      <MaterialDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAddLayer={addLayer}
      />
    </>
  );
}

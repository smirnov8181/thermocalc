import { useState, useCallback, useRef, useMemo } from 'react';
import './App.css';
import { MATERIALS, DEFAULT_LAYERS } from './data/materials';
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
  const nextIdRef = useRef(5);

  // Derived calculations
  const calc = useMemo(() => {
    const { Rtotal, Rint, Rext } = calcR(layers);
    const totalThickness = layers.reduce((s, l) => s + l.thickness, 0);
    const gsop = (tempInside - (-1.7)) * 202;
    const Rrequired = getRequired(gsop);
    const Rsanitary = getSanitary(tempInside, -23, 1, 4, 8.7);
    const dew = dewPoint(tempInside, humidityInside);
    const temps = calcTemperatures(layers, tempInside, tempOutside);
    const innerSurfaceTemp = temps.length > 1 ? temps[1].t : tempInside;
    const meetsNorm = Rtotal >= Rrequired;
    const meetsSanitary = Rtotal >= Rsanitary;
    const condensationRisk = innerSurfaceTemp <= dew;
    const qPerHour = Rtotal > 0 ? (tempInside - tempOutside) / Rtotal : 0;
    const qSeason = Rtotal > 0 ? (tempInside - (-1.7)) / Rtotal * 202 * 24 / 1000 : 0;
    return { Rtotal, totalThickness, Rrequired, Rsanitary, dewP: dew, temps, innerSurfaceTemp, meetsNorm, meetsSanitary, condensationRisk, qPerHour, qSeason };
  }, [layers, tempInside, tempOutside, humidityInside]);

  // Layer actions
  const removeLayer = useCallback((id) => {
    setLayers(prev => prev.filter(l => l.id !== id));
  }, []);

  const moveLayer = useCallback((index, dir) => {
    setLayers(prev => {
      const newIndex = index + dir;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  }, []);

  const updateThickness = useCallback((id, value) => {
    setLayers(prev => prev.map(l =>
      l.id === id ? { ...l, thickness: Math.max(1, Math.min(1000, value || 1)) } : l
    ));
  }, []);

  const reorderLayers = useCallback((fromIndex, toIndex) => {
    setLayers(prev => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
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
  }, []);

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
    const url = `${location.origin}${location.pathname}?layers=${params}&ti=${tempInside}&to=${tempOutside}`;
    navigator.clipboard?.writeText(url).then(() => {
      alert('Ссылка на расчёт скопирована!');
    });
  }, [layers, tempInside, tempOutside]);

  return (
    <>
      <Header isDark={isDark} onToggleTheme={toggleTheme} onShare={shareCalc} />

      <ClimateSettings
        tempInside={tempInside}
        tempOutside={tempOutside}
        humidityInside={humidityInside}
        humidityOutside={humidityOutside}
        onTempInsideChange={setTempInside}
        onTempOutsideChange={setTempOutside}
        onHumidityInsideChange={setHumidityInside}
        onHumidityOutsideChange={setHumidityOutside}
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

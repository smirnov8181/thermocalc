import { useEffect, useRef } from 'react';
import { drawTempGraph } from '../utils/calculations';

export default function TempGraph({ temps, dewP, isDark, layers }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const draw = () => drawTempGraph(canvasRef.current, temps, dewP, isDark, layers);
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [temps, dewP, isDark, layers]);

  return <canvas ref={canvasRef} className="temp-graph-canvas" width={520} height={220} />;
}

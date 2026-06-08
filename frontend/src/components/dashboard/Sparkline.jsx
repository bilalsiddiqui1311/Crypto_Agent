import { useEffect, useRef } from "react";

import { drawSparkline } from "../../utils/canvasCharts";

export function Sparkline({ points, positive }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !points?.length) return;
    drawSparkline(canvasRef.current, points, positive);
  }, [points, positive]);

  return <canvas ref={canvasRef} width="220" height="52" />;
}

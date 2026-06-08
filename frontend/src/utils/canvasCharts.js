import { formatCurrency, formatPercent } from "./formatters";

export function drawPriceChart(canvas, points, coin, range, currency) {
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(600, Math.floor(rect.width * ratio));
  canvas.height = Math.max(280, Math.floor(rect.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);

  const color = coin.price_change_percentage_24h >= 0 ? "#0f766e" : "#c65d44";
  drawLine(context, points, {
    width: rect.width,
    height: rect.height,
    padding: 38,
    lineWidth: 3,
    stroke: color,
    fill: coin.price_change_percentage_24h >= 0 ? "rgba(15, 118, 110, 0.14)" : "rgba(198, 93, 68, 0.14)",
    grid: true
  });

  const min = Math.min(...points);
  const max = Math.max(...points);
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted") || "#66706d";
  context.font = "700 12px Inter, system-ui, sans-serif";
  context.fillText(`Range ${range}D`, 38, 24);
  context.fillText(`High ${formatCurrency(max, currency)}`, Math.max(38, rect.width - 180), 24);
  context.fillText(`Low ${formatCurrency(min, currency)}`, Math.max(38, rect.width - 180), rect.height - 18);
  context.fillStyle = color;
  context.fillText(`${coin.symbol} ${formatPercent(coin.price_change_percentage_24h)} 24h`, 38, rect.height - 18);
}

export function drawSparkline(canvas, points, positive) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawLine(context, points, {
    width: canvas.width,
    height: canvas.height,
    padding: 5,
    lineWidth: 3,
    stroke: positive ? "#0f766e" : "#c65d44",
    fill: positive ? "rgba(15, 118, 110, 0.12)" : "rgba(198, 93, 68, 0.12)",
    grid: false
  });
}

function drawLine(context, points, options) {
  if (!points.length) return;

  const { width, height, padding, lineWidth, stroke, fill, grid } = options;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = Math.max(max - min, 0.0001);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  if (grid) {
    context.strokeStyle = "rgba(102, 112, 109, 0.14)";
    context.lineWidth = 1;
    for (let index = 0; index <= 4; index += 1) {
      const y = padding + (innerHeight / 4) * index;
      context.beginPath();
      context.moveTo(padding, y);
      context.lineTo(width - padding, y);
      context.stroke();
    }
  }

  const coords = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * innerWidth;
    const y = padding + (1 - (point - min) / spread) * innerHeight;
    return [x, y];
  });

  context.beginPath();
  coords.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = stroke;
  context.lineWidth = lineWidth;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke();

  context.lineTo(width - padding, height - padding);
  context.lineTo(padding, height - padding);
  context.closePath();
  context.fillStyle = fill;
  context.fill();

  const last = coords.at(-1);
  if (last) {
    context.beginPath();
    context.arc(last[0], last[1], 5, 0, Math.PI * 2);
    context.fillStyle = stroke;
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = "#ffffff";
    context.stroke();
  }
}

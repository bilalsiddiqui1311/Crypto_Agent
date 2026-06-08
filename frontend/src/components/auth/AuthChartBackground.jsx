export function AuthChartBackground() {
  return (
    <div className="auth-chart-bg" aria-hidden="true">
      <svg viewBox="0 0 920 520" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartLineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="var(--teal)" />
            <stop offset="55%" stopColor="var(--blue)" />
            <stop offset="100%" stopColor="var(--amber)" />
          </linearGradient>
          <linearGradient id="chartFillGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="chart-grid">
          {Array.from({ length: 7 }).map((_, index) => (
            <line key={`h-${index}`} x1="0" x2="920" y1={60 + index * 64} y2={60 + index * 64} />
          ))}
          {Array.from({ length: 9 }).map((_, index) => (
            <line key={`v-${index}`} y1="0" y2="520" x1={80 + index * 96} x2={80 + index * 96} />
          ))}
        </g>
        <path
          className="chart-fill"
          d="M0 390 C80 360 120 338 190 345 C255 352 276 245 340 252 C416 260 424 188 492 198 C568 210 590 135 664 146 C740 158 776 92 920 118 L920 520 L0 520 Z"
        />
        <path
          className="chart-line"
          d="M0 390 C80 360 120 338 190 345 C255 352 276 245 340 252 C416 260 424 188 492 198 C568 210 590 135 664 146 C740 158 776 92 920 118"
        />
        <g className="chart-bars">
          <rect x="92" y="360" width="28" height="100" rx="5" />
          <rect x="154" y="326" width="28" height="134" rx="5" />
          <rect x="216" y="376" width="28" height="84" rx="5" />
          <rect x="278" y="290" width="28" height="170" rx="5" />
          <rect x="340" y="250" width="28" height="210" rx="5" />
          <rect x="402" y="306" width="28" height="154" rx="5" />
          <rect x="464" y="220" width="28" height="240" rx="5" />
        </g>
      </svg>
    </div>
  );
}

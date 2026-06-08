export function makeCoinIcon(symbol) {
  const text = encodeURIComponent(String(symbol || "?").slice(0, 3));
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='40' fill='%23dceafd'/%3E%3Ctext x='40' y='47' text-anchor='middle' font-family='Arial,sans-serif' font-size='22' font-weight='800' fill='%232f6fbd'%3E${text}%3C/text%3E%3C/svg%3E`;
}

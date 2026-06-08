export function NavButton({ icon: Icon, label, target, active = false }) {
  return (
    <button
      className={`rail-button ${active ? "active" : ""}`}
      type="button"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" })}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

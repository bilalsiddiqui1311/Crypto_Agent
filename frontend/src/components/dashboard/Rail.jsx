import { NAV_ITEMS } from "../../constants/navigation";
import { NavButton } from "../common/NavButton";

export function Rail() {
  return (
    <aside className="rail" aria-label="Application navigation">
      <div className="brand-mark">CA</div>
      {NAV_ITEMS.map((item) => (
        <NavButton key={item.target} icon={item.icon} label={item.label} target={item.target} active={item.active} />
      ))}
    </aside>
  );
}

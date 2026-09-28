import { NavLink } from "react-router-dom";
import { FLOW } from "../warranty";

export default function BhFlow() {
  return (
    <nav className="desk-steps" aria-label="Quy trình bảo hành">
      {FLOW.map((step) => (
        <NavLink key={step.to} to={step.to}>
          {step.label}
        </NavLink>
      ))}
    </nav>
  );
}

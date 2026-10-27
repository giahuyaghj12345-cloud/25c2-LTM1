import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { canWriteWarranty } from "../api";
import { FLOW } from "../warranty";

export default function BhFlow() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const canWrite = canWriteWarranty(user);
  const steps = canWrite
    ? FLOW
    : FLOW.filter((step) => step.to === "/warranty/lookup" || step.to === "/warranty/serial-report");

  return (
    <nav className="desk-steps" aria-label="Quy trình bảo hành">
      {steps.map((step) => (
        <button
          key={step.to}
          type="button"
          className={pathname.startsWith(step.to) ? "active" : undefined}
          onClick={() => navigate(step.to)}
        >
          {step.label}
        </button>
      ))}
    </nav>
  );
}

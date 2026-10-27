import { useEffect, useState } from "react";
import { warrantyApi, type BhBoard as Board } from "../api";
import { LOAI_BH, TICKET_STATUS, day, money } from "../warranty";

const COLORS = { sua: "#2dd4bf", sale: "#fb923c", dv: "#818cf8" };

function Bars({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  const width = 132;
  const height = 48;
  const gap = 3;
  const bar = (width - gap * (values.length - 1)) / values.length;
  return (
    <svg className="bh-spark" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {values.map((value, index) => {
        const barHeight = value ? Math.max(4, (value / max) * (height - 6)) : 2;
        return (
          <rect
            key={index}
            x={index * (bar + gap)}
            y={height - barHeight}
            width={bar}
            height={barHeight}
            rx="1.5"
            fill={color}
            opacity={value ? 0.9 : 0.25}
          />
        );
      })}
    </svg>
  );
}

function Trend({ months }: { months: Board["months"] }) {
  const width = 420;
  const height = 168;
  const pad = 22;
  const max = Math.max(1, ...months.flatMap((item) => [item.sua, item.sale, item.dv]));
  const x = (index: number) => pad + (index * (width - pad * 2)) / Math.max(1, months.length - 1);
  const y = (value: number) => height - pad - (value / max) * (height - pad * 2);
  const line = (key: "sua" | "sale" | "dv") =>
    months.map((item, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(item[key]).toFixed(1)}`).join(" ");

  return (
    <svg className="bh-trend" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Phiếu bảo hành theo loại dịch vụ">
      {[0, 0.5, 1].map((step) => (
        <line key={step} x1={pad} x2={width - pad} y1={y(max * step)} y2={y(max * step)} />
      ))}
      <path className="sua" d={line("sua")} />
      <path className="sale" d={line("sale")} />
      <path className="dv" d={line("dv")} />
      {months.map((item, index) => (
        <g key={item.label}>
          <circle cx={x(index)} cy={y(item.sua)} r="3.2" fill={COLORS.sua} />
          <circle cx={x(index)} cy={y(item.sale)} r="3.2" fill={COLORS.sale} />
          <circle cx={x(index)} cy={y(item.dv)} r="3.2" fill={COLORS.dv} />
          <text x={x(index)} y={height - 4} textAnchor="middle">{item.label}</text>
        </g>
      ))}
    </svg>
  );
}

export default function BhBoard() {
  const [data, setData] = useState<Board | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void warrantyApi.board().then(setData).catch((err) => setError(err instanceof Error ? err.message : "Không tải được số liệu bảo hành"));
  }, []);

  if (error) return <p className="alert">{error}</p>;
  if (!data) return <p className="muted">Đang tải số liệu bảo hành...</p>;

  const cards = [
    { label: "Sửa / BD / BH / Lắp", value: data.sua, color: COLORS.sua, values: data.months.map((item) => item.sua) },
    { label: "Sale 1 đổi 1", value: data.sale, color: COLORS.sale, values: data.months.map((item) => item.sale) },
    { label: "DV 1 đổi 1", value: data.dv, color: COLORS.dv, values: data.months.map((item) => item.dv) },
  ];

  return (
    <div className="bh-board">
      <div className="bh-kpis">
        {cards.map((card) => (
          <article key={card.label} className="bh-kpi">
            <div>
              <span>{card.label}</span>
              <strong style={{ color: card.color }}>{card.value}</strong>
            </div>
            <Bars values={card.values} color={card.color} />
          </article>
        ))}
      </div>
      <div className="bh-steps">
        {data.steps.map((step, index) => (
          <div key={step.label}>
            {index > 0 && <span className="bh-step-arrow" aria-hidden="true">→</span>}
            <article>
              <small>{index + 1}. {step.label}</small>
              <strong>{step.count}</strong>
            </article>
          </div>
        ))}
      </div>
      <div className="bh-lower">
        <article className="bh-panel">
          <h3>Phiếu theo loại dịch vụ</h3>
          <Trend months={data.months} />
          <p className="bh-legend">
            <i style={{ background: COLORS.sua }} /> Sửa / BD / BH / Lắp
            <i style={{ background: COLORS.sale }} /> Sale 1 đổi 1
            <i style={{ background: COLORS.dv }} /> DV 1 đổi 1
          </p>
        </article>
        <article className="bh-panel">
          <h3>Phiếu bảo hành gần nhất</h3>
          <div className="table-wrap bh-users">
            <table>
              <thead>
                <tr>
                  <th>Số phiếu</th>
                  <th>Ngày</th>
                  <th>Loại</th>
                  <th>Khách</th>
                  <th>Serial</th>
                  <th>Trạng thái</th>
                  <th>Tiền</th>
                </tr>
              </thead>
              <tbody>
                {data.tickets.length === 0 && (
                  <tr>
                    <td colSpan={7}>Chưa có phiếu bảo hành.</td>
                  </tr>
                )}
                {data.tickets.map((row) => (
                  <tr key={row.so_ct}>
                    <td>{row.so_ct}</td>
                    <td>{day(row.ngay)}</td>
                    <td>{LOAI_BH[Number(row.loai_bh) || 1]}</td>
                    <td>{row.ten_kh || ""}</td>
                    <td>{row.so_serial || ""}</td>
                    <td>{TICKET_STATUS[row.status || ""] || row.status}</td>
                    <td>{money(row.t_tt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>
  );
}

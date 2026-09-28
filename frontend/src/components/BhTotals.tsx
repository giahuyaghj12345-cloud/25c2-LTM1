import { money } from "../warranty";

export default function BhTotals({ tc, tcCk, pt, ptCk, thue, pay }: { tc: number; tcCk: number; pt: number; ptCk: number; thue: number; pay: number }) {
  const truoc = tc - tcCk + (pt - ptCk);
  return (
    <div className="desk-sum">
      <table>
        <tbody>
          <tr><td>Tổng tiền công</td><td className="num">{money(tc)}</td></tr>
          <tr><td>Chiết khấu tiền công</td><td className="num">{money(tcCk)}</td></tr>
          <tr><td>Tiền công sau CK</td><td className="num">{money(tc - tcCk)}</td></tr>
        </tbody>
      </table>
      <table>
        <tbody>
          <tr><td>Tổng tiền phụ tùng</td><td className="num">{money(pt)}</td></tr>
          <tr><td>Chiết khấu phụ tùng</td><td className="num">{money(ptCk)}</td></tr>
          <tr><td>Phụ tùng sau CK</td><td className="num">{money(pt - ptCk)}</td></tr>
        </tbody>
      </table>
      <table>
        <tbody>
          <tr><td>Trước thuế</td><td className="num">{money(truoc)}</td></tr>
          <tr><td>Thuế GTGT</td><td className="num">{money(thue)}</td></tr>
          <tr><td className="pay">Thanh toán</td><td className="num pay">{money(pay)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

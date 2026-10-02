// Outgrown: a neighbourhood swap for children's clothes sorted by size, with credits instead of cash.
import { useState } from "react";
import { waLink } from "./lib/share";
import { uid, useStored } from "./lib/store";
import { useShared } from "./lib/useShared";
import { Section, ShareBox, Stat, Stats } from "./ui/kit";

const T = "outgrown";
const SIZES = ["0-3 m", "3-6 m", "6-12 m", "12-18 m", "18-24 m", "2-3 y", "3-4 y", "4-5 y", "5-6 y", "6-7 y", "7-8 y", "8-10 y", "10-12 y"];
const TYPES = ["Tops", "Trousers", "Dresses", "Jackets", "Shoes", "Pyjamas", "Sets", "Other"];
const COND = { new: { label: "New with tags", credits: 3 }, good: { label: "Good", credits: 2 }, worn: { label: "Well loved", credits: 1 } };
type Cond = keyof typeof COND;
type Fam = { id: string; name: string; phone: string };
type Item = { id: string; from: string; size: string; type: string; cond: Cond; desc: string; takenBy?: string };
type Board = { group: string; organiser: string; phone: string; items: Omit<Item, "from" | "takenBy">[] };

export default function Outgrown() {
  const shared = useShared<Board>();
  const [group, setGroup] = useStored(T, "group", "Menzah 6 Parents Swap");
  const [phone, setPhone] = useStored(T, "phone", "");
  const [organiser, setOrganiser] = useStored(T, "org", "Salma");
  const [fams, setFams] = useStored<Fam[]>(T, "fams", [{ id: "f1", name: "Salma", phone: "" }, { id: "f2", name: "Rym", phone: "" }, { id: "f3", name: "Ines", phone: "" }, { id: "f4", name: "Nadia", phone: "" }]);
  const [items, setItems] = useStored<Item[]>(T, "items", [
    { id: "i1", from: "f2", size: "2-3 y", type: "Jackets", cond: "good", desc: "Navy puffer jacket" }, { id: "i2", from: "f2", size: "2-3 y", type: "Pyjamas", cond: "good", desc: "3 cotton pyjamas" },
    { id: "i3", from: "f3", size: "5-6 y", type: "Shoes", cond: "new", desc: "Trainers size 30, never worn" }, { id: "i4", from: "f1", size: "12-18 m", type: "Sets", cond: "worn", desc: "Bag of 8 bodysuits" },
    { id: "i5", from: "f4", size: "3-4 y", type: "Dresses", cond: "good", desc: "Two summer dresses", takenBy: "f2" },
  ]);
  const [size, setSize] = useState("");
  const [d, setD] = useState({ from: "f1", size: "2-3 y", type: "Tops", cond: "good" as Cond, desc: "" });
  const [pick, setPick] = useState<string[]>([]);

  if (shared.loading) return <p className="empty-note">Opening the swap board…</p>;
  if (shared.data) {
    const b = shared.data, shown = b.items.filter(i => !size || i.size === size);
    const req = b.items.filter(i => pick.includes(i.id));
    return (
      <div className="stack">
        <section className="panel"><p className="eyebrow">Swap board</p><h2 style={{ fontSize: 34, margin: "6px 0" }}>{b.group}</h2><p className="note">Choose what you'd like, then send the list to {b.organiser}. Items cost credits: new 3, good 2, well loved 1.</p></section>
        <Section title="Available" aside={<select className="input" style={{ width: "auto" }} value={size} onChange={e => setSize(e.target.value)} aria-label="Size"><option value="">All sizes</option>{SIZES.map(s => <option key={s}>{s}</option>)}</select>}>
          <div className="og-grid">{shown.map(i => <label key={i.id} className={"og-card" + (pick.includes(i.id) ? " on" : "")}><input type="checkbox" checked={pick.includes(i.id)} onChange={e => setPick(e.target.checked ? [...pick, i.id] : pick.filter(x => x !== i.id))} /><strong>{i.desc}</strong><span className="note">{i.type} · {i.size}</span><span className="pill">{COND[i.cond].label} · {COND[i.cond].credits} credits</span></label>)}</div>
          {shown.length === 0 && <p className="empty-note">Nothing in this size right now.</p>}
        </Section>
        {req.length > 0 && <a className="btn primary" style={{ alignSelf: "flex-start" }} href={waLink(`Hi ${b.organiser}, from the swap board I'd like:\n${req.map(i => `- ${i.desc} (${i.size})`).join("\n")}\nTotal ${req.reduce((a, i) => a + COND[i.cond].credits, 0)} credits.`, b.phone)} target="_blank" rel="noreferrer">Ask for {req.length} item{req.length > 1 ? "s" : ""} on WhatsApp</a>}
        <style>{css}</style>
      </div>
    );
  }

  const bal = (id: string) => items.filter(i => i.from === id).reduce((a, i) => a + COND[i.cond].credits, 0) - items.filter(i => i.takenBy === id).reduce((a, i) => a + COND[i.cond].credits, 0);
  const avail = items.filter(i => !i.takenBy && (!size || i.size === size));
  const name = (id?: string) => fams.find(f => f.id === id)?.name ?? "?";
  const board: Board = { group, organiser, phone, items: items.filter(i => !i.takenBy).map(({ id, size, type, cond, desc }) => ({ id, size, type, cond, desc })) };
  return (
    <div className="stack">
      <Section title={group}>
        <Stats><Stat value={items.filter(i => !i.takenBy).length} label="Items available" /><Stat value={items.filter(i => i.takenBy).length} label="Swapped" tone="good" /><Stat value={fams.length} label="Families" /></Stats>
      </Section>
      <div className="grid2">
        <Section title="Bring in clothes">
          <form className="stack" style={{ gap: 10 }} onSubmit={e => { e.preventDefault(); if (!d.desc.trim()) return; setItems([{ id: uid(), ...d, desc: d.desc.trim() }, ...items]); setD({ ...d, desc: "" }); }}>
            <div className="row"><label className="field"><span>From</span><select id="og-f" className="input" value={d.from} onChange={e => setD({ ...d, from: e.target.value })}>{fams.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label><label className="field"><span>Size</span><select id="og-s" className="input" value={d.size} onChange={e => setD({ ...d, size: e.target.value })}>{SIZES.map(s => <option key={s}>{s}</option>)}</select></label></div>
            <div className="row"><label className="field"><span>Type</span><select id="og-t" className="input" value={d.type} onChange={e => setD({ ...d, type: e.target.value })}>{TYPES.map(s => <option key={s}>{s}</option>)}</select></label><label className="field"><span>Condition</span><select id="og-c" className="input" value={d.cond} onChange={e => setD({ ...d, cond: e.target.value as Cond })}>{Object.entries(COND).map(([k, c]) => <option key={k} value={k}>{c.label} ({c.credits} credits)</option>)}</select></label></div>
            <div className="row" style={{ alignItems: "flex-end" }}><label className="field"><span>Description</span><input id="og-d" className="input" value={d.desc} onChange={e => setD({ ...d, desc: e.target.value })} placeholder="Red raincoat" /></label><button className="btn primary" type="submit">Add</button></div>
          </form>
        </Section>
        <Section title="Credit balances">
          <table className="t"><tbody>{fams.map(f => { const b = bal(f.id); return <tr key={f.id}><td>{f.name}</td><td className="r" style={{ color: b < 0 ? "var(--bad)" : "var(--good)" }}>{b > 0 ? "+" : ""}{b} credits</td><td><button className="btn ghost small danger" onClick={() => setFams(fams.filter(x => x.id !== f.id))}>×</button></td></tr>; })}</tbody></table>
          <form className="row" style={{ marginTop: 10 }} onSubmit={e => { e.preventDefault(); const n = (e.currentTarget.elements.namedItem("nf") as HTMLInputElement).value.trim(); if (n) setFams([...fams, { id: uid(), name: n, phone: "" }]); e.currentTarget.reset(); }}><input name="nf" className="input" style={{ flex: 1 }} aria-label="New family" placeholder="Add a family" /><button className="btn small" type="submit">Add</button></form>
          <p className="note" style={{ marginTop: 8 }}>Families can take items while in credit, or up to 4 credits below zero.</p>
        </Section>
      </div>
      <Section title="On the rail" aside={<select className="input" style={{ width: "auto" }} value={size} onChange={e => setSize(e.target.value)} aria-label="Filter by size"><option value="">All sizes</option>{SIZES.map(s => <option key={s}>{s}</option>)}</select>}>
        <div className="og-grid">{avail.map(i => (
          <div key={i.id} className="og-card">
            <strong>{i.desc}</strong><span className="note">{i.type} · {i.size} · from {name(i.from)}</span><span className="pill">{COND[i.cond].label} · {COND[i.cond].credits}</span>
            <select className="input" style={{ fontSize: 13 }} aria-label="Given to" value="" onChange={e => { const who = e.target.value; if (who && bal(who) - COND[i.cond].credits >= -4) setItems(items.map(x => x.id === i.id ? { ...x, takenBy: who } : x)); }}>
              <option value="">Give to…</option>{fams.filter(f => f.id !== i.from).map(f => <option key={f.id} value={f.id} disabled={bal(f.id) - COND[i.cond].credits < -4}>{f.name} ({bal(f.id)})</option>)}
            </select>
          </div>))}</div>
        {avail.length === 0 && <p className="empty-note">Nothing in this size yet.</p>}
      </Section>
      <Section title="Share the board">
        <div className="row" style={{ marginBottom: 10 }}><label className="field"><span>Group name</span><input className="input" value={group} onChange={e => setGroup(e.target.value)} /></label><label className="field"><span>Organiser</span><input className="input" value={organiser} onChange={e => setOrganiser(e.target.value)} /></label><label className="field"><span>Organiser WhatsApp</span><input className="input" value={phone} onChange={e => setPhone(e.target.value)} /></label></div>
        <ShareBox slug={T} data={board} label="Copy board link" message={`${group}: what's available this week`} />
      </Section>
      <Section title="Swapped">{items.filter(i => i.takenBy).map(i => <p key={i.id} className="note">{i.desc} ({i.size}): {name(i.from)} → {name(i.takenBy)} <button className="btn ghost small" onClick={() => setItems(items.map(x => x.id === i.id ? { ...x, takenBy: undefined } : x))}>Undo</button></p>)}</Section>
      <style>{css}</style>
    </div>
  );
}
const css = `.og-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}.og-card{border:2px solid var(--line);border-radius:10px;padding:10px;display:grid;gap:4px;cursor:default}label.og-card{cursor:pointer}.og-card.on{border-color:var(--accent)}.og-card input[type=checkbox]{justify-self:end;margin:0}`;

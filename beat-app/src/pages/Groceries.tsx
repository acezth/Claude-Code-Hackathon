import { useEffect, useState } from "react";
import type { GroceryItem } from "@/services/types";

const STORAGE_KEY = "beat.groceries";

function load(): GroceryItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function save(items: GroceryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export default function Groceries() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => { setItems(load()); }, []);
  useEffect(() => { save(items); }, [items]);

  function add() {
    if (!input.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: input.trim(), done: false, addedBy: "user" },
    ]);
    setInput("");
  }

  function toggle(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clearDone() {
    setItems((prev) => prev.filter((i) => !i.done));
  }

  const todo = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);

  return (
    <>
      <div className="eyebrow">Groceries</div>
      <h1 className="h1">Your list &mdash; one place, one screen.</h1>
      <p className="lede">
        Anything Beat spots that you&rsquo;re missing (from meal scan or coach) shows up here.
      </p>

      <section className="card" style={{ marginTop: 20 }}>
        <div className="row">
          <input
            className="input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder="Add an item &hellip;"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button className="btn" onClick={add}>Add</button>
        </div>

        <div className="divider" />

        <h2 className="h2">
          To buy <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>({todo.length})</span>
        </h2>
        {todo.length === 0 ? (
          <div className="empty">Nothing on the list. Scan your meal or ask the coach for a staples run.</div>
        ) : (
          todo.map((i) => (
            <div key={i.id} className="grocery">
              <input type="checkbox" checked={i.done} onChange={() => toggle(i.id)} />
              <span className="text">{i.text}</span>
              {i.addedBy !== "user" && <span className="tag" style={{ marginLeft: 8 }}>{i.addedBy}</span>}
              <button className="remove" onClick={() => remove(i.id)} aria-label="remove">×</button>
            </div>
          ))
        )}

        {done.length > 0 && (
          <>
            <div className="divider" />
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 className="h2" style={{ margin: 0 }}>
                Picked up <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>({done.length})</span>
              </h2>
              <button className="btn sm ghost" onClick={clearDone}>Clear done</button>
            </div>
            {done.map((i) => (
              <div key={i.id} className="grocery">
                <input type="checkbox" checked={i.done} onChange={() => toggle(i.id)} />
                <span className="text done">{i.text}</span>
                <button className="remove" onClick={() => remove(i.id)} aria-label="remove">×</button>
              </div>
            ))}
          </>
        )}
      </section>
    </>
  );
}

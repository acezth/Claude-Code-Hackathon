import { useState } from "react";
import Coach from "./Coach";
import Groceries from "./Groceries";

const FUN_FACTS = [
  "A 10-minute walk after meals can lower post-meal glucose spikes.",
  "Beans and lentils are among the cheapest high-fiber protein staples.",
  "Most adults mistake thirst for hunger at least sometimes.",
  "Keeping cut vegetables visible in the fridge increases healthy snacking.",
  "Frozen produce is usually picked ripe and can match fresh nutrition.",
  "Protein at breakfast often reduces late-night cravings.",
  "A grocery list cuts impulse spending and food waste.",
  "Whole oats can support steadier energy than sugary cereal.",
  "Prepping one base ingredient can simplify three meals in a week.",
  "Low sleep tends to increase cravings for ultra-processed foods.",
];

function randomFact(): string {
  const index = Math.floor(Math.random() * FUN_FACTS.length);
  return FUN_FACTS[index];
}

export default function Eat() {
  const [fact, setFact] = useState<string>(() => randomFact());

  function rotateFact() {
    if (FUN_FACTS.length <= 1) return;
    let next = randomFact();
    while (next === fact) next = randomFact();
    setFact(next);
  }

  return (
    <>
      <div className="eyebrow">Eat</div>
      <h1 className="h1">Your coaching, meals, groceries, and inventory in one place.</h1>
      <p className="lede">
        Ask detailed coaching questions, cook from what you have, manage your shopping list and inventory, and check nearby stores.
      </p>

      <div className="eat-main-grid" style={{ marginTop: 16 }}>
        <div>
          <Coach showLessons={false} showPlanner={false} />
        </div>
        <aside className="card eat-fact-card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 className="h2" style={{ margin: 0 }}>
              Fun fact
            </h2>
            <button className="btn sm ghost" onClick={rotateFact}>
              New one
            </button>
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.45 }}>{fact}</p>
          <div className="muted" style={{ marginTop: 10 }}>
            Randomized each time this page opens.
          </div>
        </aside>
      </div>

      <div style={{ marginTop: 22 }}>
        <Groceries mode="full" />
      </div>
    </>
  );
}

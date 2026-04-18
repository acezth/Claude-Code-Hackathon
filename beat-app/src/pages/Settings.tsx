import { useEffect, useState } from "react";
import { isGoogleSignedIn, signInWithGoogle, signOutGoogle } from "@/services/google";
import {
  buildStravaAuthUrlForPath,
  completeStravaAuthFromCurrentUrl,
  disconnectStrava,
  getStravaSetupError,
  isStravaConnected,
} from "@/services/strava";
import { config } from "@/lib/config";

export default function Settings() {
  const [googleOn, setGoogleOn] = useState(isGoogleSignedIn());
  const [stravaOn, setStravaOn] = useState(isStravaConnected());
  const [stravaError, setStravaError] = useState("");
  const stravaSetupError = getStravaSetupError();

  useEffect(() => {
    completeStravaAuthFromCurrentUrl()
      .then((didConnect) => {
        if (didConnect) {
          setStravaOn(true);
          setStravaError("");
        }
      })
      .catch((error: unknown) => {
        setStravaError(error instanceof Error ? error.message : "Unable to finish Strava connection.");
      });
  }, []);

  async function toggleGoogle() {
    if (googleOn) {
      signOutGoogle();
      setGoogleOn(false);
    } else {
      await signInWithGoogle();
      setGoogleOn(true);
    }
  }

  function toggleStrava() {
    if (stravaOn) {
      disconnectStrava();
      setStravaOn(false);
      setStravaError("");
    } else if (stravaSetupError) {
      setStravaError(stravaSetupError);
    } else {
      window.location.href = buildStravaAuthUrlForPath("/settings");
    }
  }

  const openAiOn = config.openai.apiKey.length > 0;
  const anthropicOn = config.anthropic.apiKey.length > 0;
  const activeProvider = anthropicOn ? "Anthropic" : openAiOn ? "OpenAI" : "None";

  return (
    <>
      <div className="eyebrow">Settings</div>
      <h1 className="h1">Connect the pieces.</h1>
      <p className="lede">Beat gets smarter as it sees more of your day.</p>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="h2">Integrations</h2>

        {stravaError && (
          <div className="inline-alert warn" style={{ marginBottom: 16 }}>
            {stravaError}
          </div>
        )}

        <div className="conn-row">
          <div className="logo">📅</div>
          <div>
            <div style={{ fontWeight: 600 }}>Google Calendar, Gmail, Maps</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Today&apos;s schedule, relevant inbox, and nearby stores.
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <span className={`status ${googleOn ? "on" : "off"}`}>
              <span className="dot" /> {googleOn ? "Connected" : "Not connected"}
            </span>
            <button className="btn sm ghost" onClick={toggleGoogle}>
              {googleOn ? "Disconnect" : "Connect"}
            </button>
          </div>
        </div>

        <div className="conn-row">
          <div className="logo">🏃</div>
          <div>
            <div style={{ fontWeight: 600 }}>Strava</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Auto-sync activities, read athlete stats, and write manual activity summaries.
            </div>
            {stravaSetupError && (
              <div className="muted" style={{ fontSize: 12, color: "var(--warn)", marginTop: 4 }}>
                {stravaSetupError}
              </div>
            )}
          </div>
          <div className="row" style={{ gap: 10 }}>
            <span className={`status ${stravaOn ? "on" : "off"}`}>
              <span className="dot" /> {stravaOn ? "Connected" : "Not connected"}
            </span>
            <button className="btn sm ghost" onClick={toggleStrava}>
              {stravaOn ? "Disconnect" : "Connect"}
            </button>
          </div>
        </div>

        <div className="conn-row">
          <div className="logo">🧠</div>
          <div>
            <div style={{ fontWeight: 600 }}>AI provider</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Scene Scan picks, meal scan vision, and coach replies. Anthropic is preferred when both keys are present.
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <span className={`status ${openAiOn || anthropicOn ? "on" : "off"}`}>
              <span className="dot" /> {openAiOn || anthropicOn ? `${activeProvider} ready` : "Missing key"}
            </span>
            <div className="muted" style={{ fontSize: 11 }}>
              <div>OpenAI: <code>{openAiOn ? "detected" : "VITE_OPENAI_API_KEY"}</code></div>
              <div>Anthropic: <code>{anthropicOn ? "detected" : "VITE_ANTHROPIC_API_KEY"}</code></div>
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2 className="h2">Configuration</h2>
        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          Keep API keys in <code>.env.local</code> and restart <code>npm run dev</code> after changes.
        </p>
      </section>
    </>
  );
}

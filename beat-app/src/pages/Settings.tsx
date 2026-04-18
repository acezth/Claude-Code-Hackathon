import { useEffect, useState } from "react";
import { isGoogleSignedIn, signInWithGoogle, signOutGoogle } from "@/services/google";
import {
  buildStravaAuthUrlForPath,
  completeStravaAuthFromCurrentUrl,
  isStravaConnected,
  disconnectStrava,
  getStravaSetupError
} from "@/services/strava";
import { config } from "@/lib/config";

export default function Settings() {
  const [googleOn, setGoogleOn] = useState(isGoogleSignedIn());
  const [stravaOn, setStravaOn] = useState(isStravaConnected());
  const [stravaError, setStravaError] = useState<string>("");
  const stravaSetupError = getStravaSetupError();

  // If Strava redirected back with ?code=..., exchange it.
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

  const anthropicOn = config.anthropic.apiKey.length > 0;

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
              Today&rsquo;s schedule, relevant inbox, and nearby stores.
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
            <div style={{ fontWeight: 600 }}>Anthropic</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Scene Scan picks, meal scan vision, coach replies.
            </div>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <span className={`status ${anthropicOn ? "on" : "off"}`}>
              <span className="dot" /> {anthropicOn ? "Key detected" : "Missing key"}
            </span>
            <span className="muted" style={{ fontSize: 11 }}>
              set <code>VITE_ANTHROPIC_API_KEY</code>
            </span>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <h2 className="h2">Env status</h2>
        <pre style={{ fontSize: 12, background: "#0f2a47", color: "#cadcfc", padding: 14, borderRadius: 8, overflow: "auto" }}>{JSON.stringify(
          {
            google: {
              clientId: mask(config.google.clientId),
              apiKey: mask(config.google.apiKey),
              mapsKey: mask(config.google.mapsKey),
            },
            strava: {
              clientId: mask(config.strava.clientId),
              redirectUri: config.strava.redirectUri,
            },
            anthropic: {
              apiKey: mask(config.anthropic.apiKey),
              model: config.anthropic.model,
            },
          },
          null,
          2
        )}</pre>
        <p className="muted" style={{ fontSize: 12 }}>
          Copy <code>.env.example</code> to <code>.env.local</code> and fill in your keys, then restart <code>npm run dev</code>.
        </p>
      </section>
    </>
  );
}

function mask(v: string): string {
  if (!v) return "(unset)";
  if (v.length <= 6) return "•".repeat(v.length);
  return v.slice(0, 3) + "•".repeat(Math.min(v.length - 6, 8)) + v.slice(-3);
}

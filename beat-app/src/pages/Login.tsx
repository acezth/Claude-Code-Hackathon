import { useGoogleLogin } from "@react-oauth/google";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { config } from "@/lib/config";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const fromLocation = (loc.state as {
    from?: { pathname: string; search?: string; hash?: string };
  } | null)?.from;
  const from = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search ?? ""}${fromLocation.hash ?? ""}`
    : "/";

  const hasClientId = config.google.clientId.length > 0;

  const loginWithGoogle = useGoogleLogin({
    scope: GOOGLE_SCOPES,
    onSuccess: async (resp) => {
      try {
        const user = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${resp.access_token}` },
        }).then((r) => r.json());
        signIn(
          {
            sub: user.sub,
            email: user.email,
            name: user.name ?? user.email,
            picture: user.picture,
          },
          resp.access_token
        );
        nav(from, { replace: true });
      } catch (e) {
        console.error(e);
        alert("Sign-in succeeded but we couldn't read your profile. Check the console.");
      }
    },
    onError: (err) => {
      console.error(err);
      alert("Google sign-in failed. See console for details.");
    },
  });

  function demoSignIn() {
    signIn(
      {
        sub: "demo-user",
        email: "demo@beat.app",
        name: "Demo User",
        picture: "",
      },
      "demo-token"
    );
    nav(from, { replace: true });
  }

  return (
    <div className="login-shell">
      <div className="login-left">
        <div className="brand-big">
          <span className="dot" />
          <span>BEAT</span>
        </div>

        <div className="eyebrow" style={{ marginTop: 28 }}>
          A health coach for life on the beat
        </div>

        <h1 className="login-title">
          Eat this. <em>Not that.</em><br />Right now.
        </h1>

        <p className="login-lede">
          A personal nutrition coach built for people whose schedule
          doesn&rsquo;t follow a schedule.
          <br />
          Sign in so Beat can see your calendar, your inbox, and the
          stores around you&mdash;then start making calls for your
          next four hours.
        </p>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2 className="h2" style={{ marginTop: 0 }}>Sign in to Beat</h2>

          {hasClientId ? (
            <button className="btn google-btn" onClick={() => loginWithGoogle()}>
              <GoogleG /> Continue with Google
            </button>
          ) : (
            <div className="notice">
              <strong>Google sign-in not configured.</strong>
              <p style={{ marginTop: 6, marginBottom: 0 }}>
                Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env.local</code> and
                restart <code>npm run dev</code>.
              </p>
            </div>
          )}

          <div className="or-row"><span>or</span></div>

          <button className="btn ghost full" onClick={demoSignIn}>
            Continue in demo mode
          </button>

          <p className="muted" style={{ fontSize: 12, marginTop: 20 }}>
            Beat requests access to your Google profile, Calendar (read-only),
            and Gmail (read-only). You can revoke any of these at any time in{" "}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
              Google Account &rarr; Security
            </a>.
          </p>
        </div>

        <p className="muted" style={{ fontSize: 11, marginTop: 14, textAlign: "center" }}>
          By continuing you agree this is a hackathon prototype and no data is sold.
        </p>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 6.2 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 6.2 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2L31.2 33.6C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41 35 44 30 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

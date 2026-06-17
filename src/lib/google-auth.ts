import { getGoogleClientId } from "./google-config.functions";

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const GIS_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (resp: { access_token?: string; error?: string }) => void;
            error_callback?: (err: unknown) => void;
          }) => { requestAccessToken: (overrides?: { prompt?: string }) => void };
          revoke: (token: string, cb?: () => void) => void;
        };
      };
    };
  }
}

let cachedClientId: string | null = null;
let scriptPromise: Promise<void> | null = null;
let currentToken: string | null = null;
let tokenExpiresAt = 0;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar Google Identity")));
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar Google Identity"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

async function getClientId(): Promise<string> {
  if (cachedClientId) return cachedClientId;
  const { clientId } = await getGoogleClientId();
  if (!clientId) {
    throw new Error("Google Client ID não configurado. Defina GOOGLE_OAUTH_CLIENT_ID.");
  }
  cachedClientId = clientId;
  return clientId;
}

function requestToken(prompt: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadScript();
      const clientId = await getClientId();
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        prompt,
        callback: (resp) => {
          if (resp.access_token) {
            currentToken = resp.access_token;
            tokenExpiresAt = Date.now() + 55 * 60 * 1000;
            resolve(resp.access_token);
          } else {
            reject(new Error(resp.error ?? "Falha ao autenticar com Google"));
          }
        },
        error_callback: (err) => reject(err instanceof Error ? err : new Error("Falha ao autenticar")),
      });
      client.requestAccessToken({ prompt });
    } catch (e) {
      reject(e);
    }
  });
}

/** Garante consentimento explícito (popup). Chame em resposta a um clique. */
export async function ensureGoogleAuthInteractive(): Promise<string> {
  return requestToken("consent");
}

/** Retorna token, renovando silenciosamente se possível. */
export async function getAccessToken(forceInteractive = false): Promise<string> {
  if (!forceInteractive && currentToken && Date.now() < tokenExpiresAt) {
    return currentToken;
  }
  if (forceInteractive) return requestToken("consent");
  try {
    return await requestToken("");
  } catch {
    return requestToken("consent");
  }
}

export function clearGoogleAuth() {
  if (currentToken && window.google?.accounts?.oauth2) {
    try {
      window.google.accounts.oauth2.revoke(currentToken);
    } catch {
      /* ignore */
    }
  }
  currentToken = null;
  tokenExpiresAt = 0;
}

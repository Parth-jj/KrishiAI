export function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeStorageSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors in restricted iframes or private mode
  }
}

export function safeStorageRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage errors in restricted iframes or private mode
  }
}

export async function parseApiJson<T = any>(
  res: Response,
  fallbackError = "Server request failed"
): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const rawText = await res.text();

  if (!rawText) {
    if (!res.ok) {
      throw new Error(`${fallbackError} (HTTP ${res.status})`);
    }
    return {} as T;
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    if (!res.ok || contentType.includes("text/html") || rawText.trim().startsWith("<")) {
      throw new Error(
        `Backend API returned HTTP ${res.status} instead of JSON. Please verify the KrishiAI backend/API routes are deployed and running.`
      );
    }
    throw new Error(`${fallbackError} (HTTP ${res.status})`);
  }
}

export function formatUserAuthError(
  err: unknown,
  fallback = "Authentication failed. Please check your details and try again."
): string {
  if (!err) return fallback;

  const code = typeof (err as any)?.code === "string" ? (err as any).code : "";
  const rawMessage =
    err instanceof Error ? err.message : typeof err === "string" ? err : String(err);

  if (code === "auth/unauthorized-domain" || rawMessage.includes("auth/unauthorized-domain")) {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "this domain";
    return `Google Sign-In is not authorized yet for "${hostname}". Add this domain under Firebase Console → Authentication → Settings → Authorized domains, or sign in with Email/Password or the Demo Presets below.`;
  }

  if (code === "auth/popup-blocked" || rawMessage.includes("auth/popup-blocked")) {
    return "Google Sign-In popup was blocked by your browser. Please allow popups for this site and try again, or use Email/Password or Demo Presets.";
  }

  if (
    code === "auth/popup-closed-by-user" ||
    code === "auth/cancelled-popup-request" ||
    rawMessage.includes("auth/popup-closed-by-user") ||
    rawMessage.includes("auth/cancelled-popup-request")
  ) {
    return "Google Sign-In was cancelled before completion. Please try again.";
  }

  if (
    code === "auth/operation-not-supported-in-this-environment" ||
    rawMessage.includes("auth/operation-not-supported-in-this-environment")
  ) {
    return "Google popup sign-in is not supported in this embedded browser view. Open the app in a full browser tab or sign in using Email/Password or Demo Presets.";
  }

  if (code === "auth/network-request-failed" || rawMessage.includes("auth/network-request-failed")) {
    return "Network error while contacting Google Sign-In. Please check your internet connection and retry.";
  }

  if (rawMessage.startsWith("{") && rawMessage.includes("\"error\"")) {
    try {
      const parsed = JSON.parse(rawMessage);
      if (typeof parsed?.error === "string") {
        if (parsed.error.toLowerCase().includes("insufficient permissions")) {
          return "Could not access your cloud farm profile due to Firestore permissions. Please sign out and sign in again with a verified Google account, or use Email/Password / Demo Presets.";
        }
        return parsed.error;
      }
    } catch {
      // fall through
    }
  }

  if (rawMessage.includes("Unexpected token '<'") || rawMessage.includes("is not valid JSON")) {
    return "Backend API returned an HTML page instead of JSON. Please verify the API server / Vercel /api routes are properly deployed.";
  }

  if (rawMessage === "Failed to fetch" || rawMessage.includes("Load failed")) {
    return "Could not reach the KrishiAI backend server. Please check your network connection and verify the server is running.";
  }

  return rawMessage || fallback;
}

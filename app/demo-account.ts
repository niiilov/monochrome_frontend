const demoAccountKey = "mono-demo-account";

export type DemoAccount = { name: string; email: string };

// An absent entry allows the public demo. A null entry marks an explicit sign-out.
export function readDemoAccount(): DemoAccount | null | undefined {
  try {
    const stored = sessionStorage.getItem(demoAccountKey);
    if (stored === null) return undefined;
    const account = JSON.parse(stored);
    if (account === null) return null;
    if (typeof account?.name === "string" && typeof account.email === "string") return account;
  } catch {}
}

export function saveDemoAccount(account: DemoAccount | null) {
  try {
    sessionStorage.setItem(demoAccountKey, JSON.stringify(account));
    return true;
  } catch {
    return false;
  }
}

export const toISO = (d: Date) => d.toISOString();
export const uuid = () =>
  // crypto.randomUUID() en Node 19+. Para compatibilidad:
  (globalThis.crypto && "randomUUID" in globalThis.crypto)
    ? (globalThis.crypto as any).randomUUID()
    : require("crypto").randomUUID();

// URL base de la aplicación (sin barra final)
const getRootUrl = () => {
  const url =
    process.env.NEXT_PUBLIC_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://basedapp-alpha.vercel.app"
      : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  // Remover barra final si existe para evitar dobles barras
  return url.replace(/\/$/, "");
};

const ROOT_URL = getRootUrl();

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header:
      "eyJmaWQiOjgxOTEyNywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDUyN2YxZjA5RTZjYmQ3N2QxZjhBRDM0NmFCMEZhQ0NFMTUwODE2NTkifQ",
    payload: "eyJkb21haW4iOiJiYXNlZGFwcC1hbHBoYS52ZXJjZWwuYXBwIn0",
    signature:
      "6SFBe7gbF++ZNJBQ66wTcx/5Fx63BSRi9J0VNWqZUDJpXAfC3JwzB9JE7THVMAofZZGjr2xtfe9sgfbavXOTZBs=",
  },
  baseBuilder: {
    ownerAddress: "0xe10f2B7701B54aEC855934cbce25bD35975504D2", // Wallet con la que te logueaste en Base.dev
  },
  miniapp: {
    version: "1",
    name: "Trading Bot With Based",
    subtitle: "Trading Bot Automatizado",
    description:
      "Bot de trading automatico para Based optimizado para maximizar ganancias Detecta lateralizaciones rupturas de tendencias e impulsos fuertes Gestion inteligente de capital con apalancamiento dinamico y stop loss adaptativo",
    noindex: false,
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/logo.svg`,
    splashBackgroundColor: "#0f3460",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: ["trading", "crypto", "bot", "automated", "futures"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`,
    tagline: "Trading automático inteligente",
    ogTitle: "Trading Bot With Based",
    ogDescription:
      "Bot de trading automático para Based. Detecta lateralizaciones y rupturas. Apalancamiento dinámico.",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
  },
} as const;

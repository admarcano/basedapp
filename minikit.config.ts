const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  miniapp: {
    version: "1",
    name: "Trading Bot With Marcano",
    subtitle: "Bot de Trading Automático en Based",
    description:
      "Bot de trading automático para Based (app.based.one) optimizado para maximizar ganancias. Detecta lateralizaciones, rupturas de tendencias e impulsos fuertes. Gestión inteligente de capital con apalancamiento dinámico y stop loss adaptativo. Operaciones rentables 24/7 en futuros de criptomonedas.",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/logo-icon.svg`,
    splashImageUrl: `${ROOT_URL}/logo.svg`,
    splashBackgroundColor: "#0f3460",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "finance",
    tags: [
      "trading",
      "crypto",
      "bot",
      "automated",
      "futures",
      "trading-bot",
      "marcano",
      "grid-bot",
      "based",
    ],
    heroImageUrl: `${ROOT_URL}/logo.svg`,
    tagline: "Trading automático inteligente en Based - Maximiza tus ganancias",
    ogTitle: "Trading Bot With Marcano - Bot de Trading para Based",
    ogDescription:
      "Bot de trading automático para Based (app.based.one) que detecta lateralizaciones, rupturas e impulsos. Apalancamiento dinámico y gestión inteligente de riesgo. Opera en futuros de BTC, ETH, SOL, XRP y HYPE. Empieza con $10 y crece automáticamente.",
    ogImageUrl: `${ROOT_URL}/logo.svg`,
  },
} as const;

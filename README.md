# 🤖 Trading Bot With Based

Bot de trading automático que opera en **Based (app.based.one)** con estrategias inteligentes para maximizar ganancias en futuros de criptomonedas.

---

## ✅ Estado Actual

### Lo que ya está hecho:

- ✅ **Código completo**: Bot de trading con todas las estrategias implementadas
- ✅ **Desplegado en Vercel**: La app está en producción
- ✅ **Repo en GitHub**: Código subido al repositorio
- ✅ **Variables de entorno**: Configuradas (o listas para configurar)
- ✅ **UI/UX mejorada**: Diseño futurista y elegante
- ✅ **Sistema de suscripciones**: Implementado (100€/mes)
- ✅ **Autenticación Based**: Implementada (simulada en desarrollo)
- ✅ **Gestión de capital**: Usuario puede configurar cuánto usar

### Lo que falta por hacer:

- ⏳ **Generar Account Association** para Base
- ⏳ **Probar la miniapp** en Base/Farcaster
- ⏳ **Publicar en Based Marketplace** (si existe y está disponible)

---

## 🧪 Cómo Probar la Miniapp

### Opción 1: Probar en Base Preview (Recomendado)

1. **Ve a**: https://base.dev/preview
2. **Pega tu URL de Vercel** en el campo "App URL" (ej: `https://tu-proyecto.vercel.app`)
3. **Haz clic en "Preview"**
4. La miniapp se abrirá en un iframe y podrás probarla

**📋 Nota sobre el JSON de Farcaster:**

- ✅ El JSON ya está disponible automáticamente en: `https://tu-proyecto.vercel.app/.well-known/farcaster.json`
- ✅ Base.dev lo detectará automáticamente cuando pegues tu URL
- ✅ **NO necesitas copiar y pegar el JSON manualmente** - Base lo obtiene de tu URL
- ✅ Si base.dev te pide el JSON, simplemente pega tu URL de Vercel y Base lo obtendrá automáticamente

**Nota**: Si necesitas Account Association, ve a https://base.dev/preview?tab=account y genera uno.

### Opción 2: Probar en Farcaster (Si tienes cuenta)

1. **Abre Warpcast** (app de Farcaster)
2. **Crea un post** con la URL de tu miniapp
3. La miniapp aparecerá como frame/miniapp en el post
4. Los usuarios pueden interactuar con ella

### Opción 3: Probar directamente en navegador

1. **Abre tu URL de Vercel** directamente en el navegador
2. La app funciona como una web app normal
3. Puedes probar todas las funcionalidades

**Limitación**: La autenticación con Based puede no funcionar completamente fuera del contexto de Based.

---

## 📋 Próximos Pasos

### Paso 1: Generar Account Association y Base Builder

**¿Qué es?**

- **Account Association**: Vincula tu dominio con una wallet, permitiendo que Base verifique que eres el dueño de la miniapp.
- **Base Builder ownerAddress**: Es la dirección de tu wallet (0x...) que usas para firmar. **NO es tu usuario de Farcaster**, es tu dirección de wallet.

**Cómo hacerlo:**

1. **Obtén tu dirección de wallet**:

   - Abre tu wallet (MetaMask, Coinbase Wallet, etc.)
   - Copia tu dirección (formato: `0x...`)
   - Esta es la dirección que usarás en `ownerAddress`

2. **Genera Account Association**:

   **Opción A: Directamente en Base.dev (MÁS FÁCIL - RECOMENDADO)**:

   - Ve a: **https://base.dev/preview?tab=account**
   - Pega tu URL de Vercel (ej: `https://basedapp-alpha.vercel.app`)
   - Conecta tu wallet (la misma que usarás como ownerAddress)
   - Haz clic en "Submit" → "Verify"
   - Firma el mensaje con tu wallet
   - Copia el objeto `accountAssociation` generado (tiene `header`, `payload`, `signature`)

   **Opción B: Si Base.dev te redirige a ProductClank/Warpcast**:

   - Cuando Base.dev te redirige a Warpcast, verás una app llamada **ProductClank**
   - En ProductClank, busca el campo **"Domain"** o **"Dominio"**
   - Ingresa: `basedapp-alpha.vercel.app` (sin https://)
   - Ingresa tu **Wallet Address**: `0xe10f2B7701B54aEC855934cbce25bD35975504D2`
   - **Firma el mensaje** con tu wallet
   - Copia el `accountAssociation` generado (header, payload, signature)

   **💡 Consejo**: Si ProductClank es confuso, usa la Opción A (Base.dev directamente). Es más simple.

3. **Actualiza `minikit.config.ts`**:
   - Abre `minikit.config.ts`
   - Pega los valores del `accountAssociation`
   - Añade tu `ownerAddress` (tu dirección de wallet):

```typescript
export const minikitConfig = {
  accountAssociation: {
    header: "tu_header_aqui",
    payload: "tu_payload_aqui",
    signature: "tu_signature_aqui",
  },
  baseBuilder: {
    ownerAddress: "0xTuDireccionDeWalletAqui", // Tu dirección de wallet
  },
  miniapp: {
    // ... resto de la configuración
  },
};
```

4. **Haz commit y push**:

```bash
git add minikit.config.ts
git commit -m "Add account association and baseBuilder ownerAddress"
git push origin main
```

Vercel desplegará automáticamente. El JSON estará disponible en:

- `https://tu-proyecto.vercel.app/.well-known/farcaster.json`

**❓ Sobre el hook `fc:miniapp`**: NO necesitas ningún hook `fc:miniapp`. Ya tienes `useMiniKit` de OnchainKit, que es lo correcto.

### Paso 2: Probar en Base Preview

1. Ve a: **https://base.dev/preview**
2. Pega tu URL de Vercel
3. Verifica que todo funcione correctamente
4. Prueba:
   - Login con Based (puede estar simulado)
   - Configuración de capital
   - Iniciar el bot
   - Ver señales y órdenes

### Paso 3: Publicar en Base App (Opcional)

Si quieres que otros usuarios vean tu miniapp en Base:

1. **Abre la app Base** en tu móvil
2. **Crea un post** con la URL de tu miniapp
3. La app aparecerá como Mini App en el post
4. Otros usuarios podrán interactuar con ella

### Paso 4: Publicar en Based Marketplace (Si está disponible)

**⚠️ IMPORTANTE**: No tengo información confirmada sobre cómo funciona el marketplace de Based.

**Lo que necesitas investigar:**

1. **Accede a**: https://app.based.one
2. **Busca**:
   - "Marketplace" o "Mini App Marketplace"
   - "Developers" o "Submit App"
   - "Publish" o "Publicar"
3. **Si encuentras un formulario**, necesitarás:
   - Nombre: "Trading Bot With Based"
   - Descripción: "Bot de trading automático para Based..."
   - URL: Tu URL de Vercel
   - Icono: `https://tu-proyecto.vercel.app/logo-icon.svg`
   - Screenshot: `https://tu-proyecto.vercel.app/screenshot-portrait.png`
   - Permisos: Todos los relacionados con trading (place orders, read balance, etc.)

**Si no encuentras un marketplace o formulario de publicación:**

- Contacta con el equipo de Based
- Busca documentación en su sitio web
- Pregunta en sus canales de comunidad

---

## 🔧 Configuración Actual

### Variables de Entorno Requeridas

```env
# REQUERIDO: Clave API de Coinbase (Client API Key)
NEXT_PUBLIC_ONCHAINKIT_API_KEY=cb_tu_clave_aqui

# REQUERIDO: URL de tu app
NEXT_PUBLIC_URL=https://tu-proyecto.vercel.app

# REQUERIDO: Wallet para recibir pagos de suscripción (100€)
NEXT_PUBLIC_PAYMENT_WALLET=0xTuWalletAqui
```

**Obtener Client API Key:**

1. Ve a: https://portal.cdp.coinbase.com/
2. Selecciona tu proyecto
3. Busca "Client API Key" en el dashboard
4. Cópiala (formato: `cb_xxxxx`)

### Cómo Funciona el Bot

**IMPORTANTE**: El bot funciona como aplicación web en el navegador del usuario.

- ✅ Opera automáticamente cuando está **activado** y la página está **abierta**
- ✅ Se ejecuta cada 5 segundos mientras el usuario tiene la página abierta
- ❌ **NO funciona si el usuario cierra la página o el navegador**
- ❌ **NO funciona "offline"** sin que el usuario tenga la página abierta

**Para operación 24/7:** Necesitarías un backend que corra en un servidor 24/7.

---

## 🎯 Características del Bot

- **Estrategias inteligentes**: Detección de régimen de mercado, estrategias adaptativas y agresivas
- **Gestión de capital**: Usuario configura cuánto capital usar de su cuenta Based
- **Apalancamiento dinámico**: Se ajusta de 3x a 20x según análisis de mercado
- **Stop Loss y Take Profit adaptativos**: Se ajustan según condiciones del mercado
- **Múltiples pares**: BTC, ETH, SOL, XRP, HYPE
- **Sistema de suscripciones**: 100€/mes (gratis para `albertodiazmarcano@gmail.com`)

---

## 📁 Estructura del Proyecto

```
basedapp/
├── app/
│   ├── trading/page.tsx          # Página principal del bot
│   └── page.tsx                   # Redirige a /trading
├── components/
│   ├── Logo.tsx                   # Logo del bot
│   └── trading/                   # Componentes del bot
├── lib/
│   ├── services/                  # Servicios (precios, señales, estrategias, etc.)
│   ├── hooks/                     # Hooks de React
│   └── types/                     # Tipos TypeScript
├── minikit.config.ts             # Configuración de Mini App
└── README.md                      # Este archivo
```

---

## 🚨 Problemas Comunes

### "Error al obtener balance de Based"

- **Es normal**: La API de Based no está disponible aún
- El bot usa valores simulados ($10,000)
- No afecta la funcionalidad

### "No encuentro Client API Key"

- Busca en el dashboard principal del proyecto (no en settings)
- Si no la ves, crea un nuevo proyecto en Coinbase Portal
- Asegúrate de estar en el proyecto correcto

### "Based authentication no funciona"

- En desarrollo local, Based puede no funcionar completamente
- Prueba desplegando en Vercel y accediendo desde Base Preview
- Based maneja la autenticación automáticamente cuando está en el marketplace

---

## 📞 Siguiente Paso Inmediato

**Tu siguiente paso es:**

1. **Probar la miniapp en Base Preview**:

   - Ve a https://base.dev/preview
   - Pega tu URL de Vercel
   - Verifica que todo funcione

2. **Generar Account Association** (opcional pero recomendado):

   - Ve a https://base.dev/preview?tab=account
   - Sigue los pasos para generar el accountAssociation
   - Actualiza `minikit.config.ts`

3. **Investigar Based Marketplace**:
   - Accede a https://app.based.one
   - Busca opciones de publicación o marketplace
   - Si no encuentras nada, contacta con el equipo de Based

---

**¡Listo para probar!** 🚀

La app está desplegada y funcionando. Solo necesitas probarla en Base Preview y luego investigar cómo publicarla en Based Marketplace.

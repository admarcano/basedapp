import { withValidManifest } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../../../minikit.config";

export async function GET() {
  const manifest = withValidManifest(minikitConfig);
  
  // Asegurar que baseBuilder esté incluido en el JSON
  const response = {
    ...manifest,
    ...(minikitConfig.baseBuilder && { baseBuilder: minikitConfig.baseBuilder }),
  };
  
  return Response.json(response, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

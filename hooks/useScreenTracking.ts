import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";
import { logScreenView } from "../utils/firebase";

/**
 * Hook que trackea automáticamente las vistas de pantalla en Firebase Analytics.
 * Usa `usePathname` de expo-router para detectar cambios de ruta.
 *
 * Firebase registra:
 * - Nombre de la pantalla
 * - Tiempo que el usuario pasa en cada pantalla
 * - Transiciones entre pantallas
 *
 * Estos datos aparecen en Firebase Console > Analytics > Events > screen_view
 */
export function useScreenTracking(): void {
  const pathname = usePathname();
  const previousScreen = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && pathname !== previousScreen.current) {
      // Convertir ruta a nombre legible: "/(tabs)/home" → "home", "/login" → "login"
      const screenName =
        pathname
          .replace(/^\/(tabs)?\/?\(?tabs\)?\/*/i, "")
          .replace(/^\/*/, "") || "index";

      previousScreen.current = pathname;
      logScreenView(screenName);
    }
  }, [pathname]);
}

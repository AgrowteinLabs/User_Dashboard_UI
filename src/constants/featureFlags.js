/**
 * Feature Flags Configuration
 *
 * Supported modes for Farm Health Score:
 * - 'coming_soon': Preserves the dashboard card slot with a "Coming Soon / AI Model in Training"
 *                  state (zero network requests to /health).
 * - 'hidden': Completely hides the Farm Health widget from the dashboard.
 *             The Farm Weather card expands to full width (col-12). Zero network requests.
 * - 'active': Live farm health score with rule-based calculation (calls GET /api/v1/products/:uid/health).
 *
 * Resolution precedence:
 * 1. window.localStorage.getItem('feature_farm_health_mode') (for instant runtime testing)
 * 2. import.meta.env.VITE_FARM_HEALTH_MODE ('coming_soon' | 'hidden' | 'active')
 * 3. Boolean fallback: import.meta.env.VITE_ENABLE_FARM_HEALTH ('true' -> active, 'false' -> coming_soon)
 * 4. Default: 'coming_soon' (Temporary Phase 2 AI Model integration deprecation)
 */

export const FARM_HEALTH_MODES = Object.freeze({
  COMING_SOON: "coming_soon",
  HIDDEN: "hidden",
  ACTIVE: "active",
});

export const getFarmHealthMode = () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const localOverride = window.localStorage.getItem("feature_farm_health_mode");
      if (localOverride) {
        const val = localOverride.toLowerCase().trim();
        if (val === "active" || val === "enabled" || val === "true") return FARM_HEALTH_MODES.ACTIVE;
        if (val === "hidden" || val === "hide") return FARM_HEALTH_MODES.HIDDEN;
        if (val === "coming_soon" || val === "comingsoon") return FARM_HEALTH_MODES.COMING_SOON;
      }
    }
  } catch {
    // Ignore localStorage access restrictions (e.g. strict sandbox / incognito)
  }

  const envMode = import.meta.env.VITE_FARM_HEALTH_MODE;
  if (envMode) {
    const val = envMode.toLowerCase().trim();
    if (val === "active" || val === "enabled" || val === "true") return FARM_HEALTH_MODES.ACTIVE;
    if (val === "hidden" || val === "hide") return FARM_HEALTH_MODES.HIDDEN;
    if (val === "coming_soon" || val === "comingsoon") return FARM_HEALTH_MODES.COMING_SOON;
  }

  const envEnable = import.meta.env.VITE_ENABLE_FARM_HEALTH;
  if (envEnable !== undefined && envEnable !== null && envEnable !== "") {
    const val = String(envEnable).toLowerCase().trim();
    if (val === "true" || val === "1") return FARM_HEALTH_MODES.ACTIVE;
    if (val === "false" || val === "0") return FARM_HEALTH_MODES.COMING_SOON;
  }

  return FARM_HEALTH_MODES.COMING_SOON;
};

export const isFarmHealthHidden = () => getFarmHealthMode() === FARM_HEALTH_MODES.HIDDEN;
export const isFarmHealthComingSoon = () => getFarmHealthMode() === FARM_HEALTH_MODES.COMING_SOON;
export const isFarmHealthActive = () => getFarmHealthMode() === FARM_HEALTH_MODES.ACTIVE;

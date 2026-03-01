# Global Mode + Per-Control Capability Implementation Summary

**Date:** February 27, 2026  
**Status:** ✅ Frontend Implementation Complete

---

## Overview

This document summarizes the frontend implementation of global manual/automate mode with support for mixed-capability controllers (some supporting automation, some manual-only).

---

## Key Changes

### 1. **AreaCards.jsx** - Main Component Update

#### State Changes

- **Removed:** `const [mode, setMode] = useState("manual");` (local state)
- **Added:** `const [modeSwitchLoading, setModeSwitchLoading] = useState(false);` (loading state for async operation)
- **Source of Truth:** Now uses `productDetails.mode` (from backend)

#### Mode Derivation Logic

**Old:** Mode was derived from controls:

```javascript
const allAuto = selected.controls.every((c) => c.automate);
setMode(allAuto ? "automate" : "manual");
```

**New:** Mode comes directly from backend:

```javascript
console.log("📊 Product mode:", selected.mode);
console.log(
  "🎛️ Controls with supportsAuto:",
  selected.controls.map((c) => ({
    name: c.name,
    supportsAuto: c.supportsAuto,
    automate: c.automate,
  })),
);
```

#### Mode Toggle Handler

**Old:** Individual MQTT commands to each device, then per-control database updates via `/api/v1/command/control/save`

**New:** Single API call to `/api/v1/product/{uid}/mode`

```javascript
const handleModeToggle = async () => {
  const newMode = productDetails.mode === "manual" ? "automate" : "manual";

  // Call new global mode endpoint
  const response = await fetch(
    `${url}/api/v1/product/${selectedProductUid}/mode`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: newMode }),
    },
  );

  const result = await response.json();
  // Shows feedback about:
  // - result.updatedControls (controls that were changed)
  // - result.skippedControls (manual-only controls that weren't affected)
};
```

#### Control UI Rendering

**Manual Mode Controls:**

```jsx
{productDetails?.mode === "manual" && (
  // Show ON/OFF power buttons for all controls
)}
```

**Manual-Only Indicator (Manual Mode):**

```jsx
{productDetails?.mode === "manual" && !control.supportsAuto && (
  // Show badge: "🪜 Manual Control Only"
)}
```

**Automate Mode - Auto-capable Controls:**

```jsx
{productDetails?.mode === "automate" && control.supportsAuto && (
  // Show threshold and offset sliders
)}
```

**Automate Mode - Manual-Only Controls:**

```jsx
{productDetails?.mode === "automate" && !control.supportsAuto && (
  // Show warning badge about manual-only capability
)}
```

#### Mode Display

```jsx
<Switch
  checked={productDetails?.mode === "automate"}
  onChange={handleModeToggle}
  disabled={!controls.length || modeSwitchLoading}
/>
<span>{productDetails?.mode?.toUpperCase() || "MANUAL"}</span>
```

---

### 2. **commands.js** - New API Function

Added `setProductMode()` function:

```javascript
/**
 * Update global product mode (manual or automate)
 * Automatically handles controls based on their supportsAuto capability
 * @param {string} uid - Product UID
 * @param {string} mode - "manual" or "automate"
 * @returns {Promise} Response with updatedControls and skippedControls
 */
export async function setProductMode(uid, mode) {
  const response = await fetch(
    `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/product/${uid}/mode`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ mode }),
    },
  );
  return await response.json();
}
```

---

## Data Structure Changes Expected from Backend

### Response from `GET /api/v1/user/product/{userId}`

```json
{
  "uid": "ABC123",
  "alias": "Farm Controller",
  "mode": "manual", // or "automate" - NEW FIELD ⭐
  "controls": [
    {
      "controlId": "pump1",
      "name": "Water Pump",
      "min": 0,
      "max": 100,
      "threshHold": 65,
      "offset": 5,
      "supportsAuto": true, // NEW FIELD ⭐
      "automate": true,
      "state": "ON"
    },
    {
      "controlId": "light1",
      "name": "Grow Light",
      "min": 0,
      "max": 100,
      "supportsAuto": false, // Manual-only controller
      "automate": false,
      "state": "OFF"
    }
  ]
}
```

### Response from `POST /api/v1/product/{uid}/mode`

```json
{
  "uid": "ABC123",
  "mode": "automate",
  "updatedControls": ["pump1", "fan1"],
  "skippedControls": ["light1"]
}
```

**Meanings:**

- `updatedControls`: Controls that were changed (because they support automation)
- `skippedControls`: Manual-only controls that remain in manual mode

---

## Backward Compatibility

✅ **Automatic Normalization by Backend:**

- Old controllers without `mode` field → Receive `mode: "manual"` (default)
- Old controls without `supportsAuto` → Receive `supportsAuto: true` (default)

**No frontend migration code needed** - the backend handles all defaults automatically.

---

## UI/UX Changes

### Mode Indicator Area

```
┌─────────────────────────────────┐
│ Mode: [Manual] ⊚ Automate       │
│ Status: 3 auto-capable          │
│ Info:   1 manual-only (locked)  │
└─────────────────────────────────┘
```

### Control Card - Manual Mode

```
┌─────────────────────────────────┐
│ Water Pump                      │
│ Status: ON                      │
│ [TURN OFF]                      │
└─────────────────────────────────┘
```

### Control Card - Automate Mode (Auto-capable)

```
┌─────────────────────────────────┐
│ Water Pump                      │
│ Threshold: ──●─── 65%           │
│ Offset:    ────●── 5            │
│ [Save Configuration]            │
└─────────────────────────────────┘
```

### Control Card - Automate Mode (Manual-only)

```
┌─────────────────────────────────┐
│ Grow Light (Manual-only)        │
│ ⚠️  This controller does not     │
│ support automatic mode.         │
└─────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Load product with mixed controllers (some auto-capable, some manual-only)
- [ ] Verify `product.mode` is displayed correctly
- [ ] Toggle global mode from "manual" to "automate"
  - [ ] Confirm backend receives request to `/api/v1/product/{uid}/mode`
  - [ ] Verify response includes `updatedControls` and `skippedControls`
  - [ ] Check UI shows which controls were updated vs. skipped
- [ ] Toggle back from "automate" to "manual"
  - [ ] Confirm all controls are set to manual mode
  - [ ] Verify no "skipped" controls in response
- [ ] In automate mode, verify:
  - [ ] Auto-capable controls show threshold/offset sliders
  - [ ] Manual-only controls show warning badge
- [ ] In manual mode, verify:
  - [ ] All controls show ON/OFF buttons
  - [ ] Manual-only controls show "(Manual Only)" badge
- [ ] Disable mode toggle when no controls exist
- [ ] Test mode persistence across page refreshes

---

## Console Logging

The implementation includes detailed logging for debugging:

```javascript
// On product load
console.log("📊 Product mode:", selected.mode);
console.log("🎛️ Controls with supportsAuto:", [...]);

// On mode toggle
console.log("✅ Global mode updated:", result);
console.log("📋 Updated controls:", result.updatedControls);
console.log("⏭️ Skipped controls (manual-only):", result.skippedControls);
```

Open browser DevTools (F12) → Console tab to monitor these messages.

---

## Files Modified

1. **src/components/dashboard/areaCards/AreaCards.jsx**
   - Updated state management
   - Replaced mode toggle handler
   - Added supportsAuto checks to control rendering
   - Updated mode display in UI

2. **src/api/commands.js**
   - Added `setProductMode(uid, mode)` function

---

## Next Steps (Backend Required)

The frontend is ready, but depends on these backend changes:

1. ✅ Add `mode` field to UserProduct schema (default: "manual")
2. ✅ Add `supportsAuto` field to Control schema (default: true)
3. ✅ Create `POST /api/v1/product/{uid}/mode` endpoint
4. ✅ Implement smart control update logic (skip manual-only controls)
5. ✅ Return `updatedControls` and `skippedControls` in response

---

## Known Limitations

- Mode toggle is disabled when no controls exist (safety feature)
- Mode persists in backend, UI always reflects server state
- No offline mode supported (requires backend connectivity)

---

**Document Version:** 1.0  
**Last Updated:** February 27, 2026

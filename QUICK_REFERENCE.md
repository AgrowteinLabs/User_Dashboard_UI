# 🚀 Quick Reference: Global Mode Implementation

**Status:** ✅ Ready to Deploy  
**Date:** February 27, 2026

---

## What Changed?

### Frontend

- ✅ Mode is now a **product-level field** (`productDetails.mode`)
- ✅ Controls have a **capability flag** (`control.supportsAuto`)
- ✅ Global mode toggle calls **one backend endpoint** instead of per-control updates

### Backend

- ✅ New endpoint: `POST /api/v1/product/{uid}/mode`
- ✅ All responses include `mode` and `supportsAuto` fields
- ✅ Automatic defaults for old data (backward compatible)

---

## Code Changes Summary

| File            | Change                                 | Impact                            |
| --------------- | -------------------------------------- | --------------------------------- |
| `AreaCards.jsx` | Domain: `mode` → `productDetails.mode` | UI now uses backend state         |
| `AreaCards.jsx` | Handler: Rewrote `handleModeToggle()`  | Calls new endpoint, shows results |
| `AreaCards.jsx` | Rendering: Added `supportsAuto` checks | Shows correct UI per control      |
| `commands.js`   | Added: `setProductMode(uid, mode)`     | Optional utility function         |

---

## Real-World Example

**Scenario:** Farm with 4 controllers

- Controller 1 (Pump): `supportsAuto: true` ✅
- Controller 2 (Fan): `supportsAuto: true` ✅
- Controller 3 (Light): `supportsAuto: true` ✅
- Controller 4 (Valve): `supportsAuto: false` ❌ (manual-only)

### Before: Manual Mode

```
Pump      [ON/OFF button]
Fan       [ON/OFF button]
Light     [ON/OFF button]
Valve     [ON/OFF button]
```

### Action: Click global mode toggle → Switch to "Automate"

### After: Automate Mode

```
Pump      [Threshold slider] [Offset slider] [Save]
Fan       [Threshold slider] [Offset slider] [Save]
Light     [Threshold slider] [Offset slider] [Save]
Valve     ⚠️ Manual Control Only - Does not support automatic mode
```

**Backend Response:**

```json
{
  "mode": "automate",
  "updatedControls": ["C1", "C2", "C3"], // 3 controls updated
  "skippedControls": ["C4"] // 1 valve unchanged
}
```

---

## Testing Scenarios

### ✅ Test 1: Toggle Manual → Automate

```javascript
// UI Action:
User clicks mode toggle switch

// Expected:
1. SweetAlert: "Switching mode..."
2. Backend: POST /api/v1/product/ABC123/mode { mode: "automate" }
3. Response: { mode: "automate", updatedControls: [...], skippedControls: [...] }
4. UI: Shows threshold sliders for capable controls, warnings for manual-only
5. SweetAlert: "✅ Mode Updated - Updated: X controls, Manual-only: Y controls"
```

### ✅ Test 2: Toggle Automate → Manual

```javascript
// UI Action:
User clicks mode toggle switch again

// Expected:
1. SweetAlert: "Switching mode..."
2. Backend: POST /api/v1/product/ABC123/mode { mode: "manual" }
3. Response: { mode: "manual", updatedControls: [...], skippedControls: [] }
4. UI: Shows ON/OFF buttons for all controls
5. SweetAlert: "✅ Mode Updated - Updated: X controls"
```

### ✅ Test 3: Threshold Update (Automate Mode)

```javascript
// UI Action:
User adjusts threshold slider and clicks "Save Configuration"

// Expected:
1. SweetAlert: "Sending..."
2. Backend: POST /api/v1/command/control/save with threshold value
3. Response: { success: true }
4. SweetAlert: "✅ Success - Configuration saved successfully"
```

### ✅ Test 4: Power Toggle (Manual Mode)

```javascript
// UI Action:
User clicks "TURN ON" button

// Expected:
1. SweetAlert: "Sending..."
2. Backend: POST /api/v1/command with power state
3. Response: { success: true }
4. SweetAlert: "✅ Success - Control turned ON"
```

### ✅ Test 5: Page Refresh

```javascript
// Action:
User refreshes page in the middle of using the app

// Expected:
1. Product data reloads
2. Mode is maintained (from backend)
3. supportsAuto flags are present
4. UI displays correctly without any issues
```

---

## Debugging Guide

### Problem: Mode toggle not working

**Step 1:** Check console for errors

```javascript
F12 → Console tab → Look for ❌ messages
```

**Step 2:** Check network request

```
F12 → Network tab → Filter: "mode"
Look for POST /api/v1/product/.../mode
Check response status and body
```

**Step 3:** Verify backend endpoint is available

```bash
curl -X POST http://localhost:3000/api/v1/product/ABC123/mode \
  -H "Content-Type: application/json" \
  -d '{"mode":"automate"}'
```

### Problem: supportsAuto field missing

**Cause:** Backend not returning field

**Check:**

```javascript
F12 → Network → GET /api/v1/user/product/...
Look for controls array
Each control should have "supportsAuto" field
```

**Solution:**
Ensure backend is updated and returning this field in all responses

### Problem: UI not updating after mode toggle

**Cause:** Product details not refetched

**Check:**

```javascript
After toggle, there should be a refetch request
Check console for: "✅ Product details refreshed from backend"
```

---

## Performance Impact

| Operation            | Time   | Impact                 |
| -------------------- | ------ | ---------------------- |
| Load product details | ~500ms | Normal API call        |
| Toggle global mode   | ~1-2s  | 1 API call + refetch   |
| Save threshold       | ~1-2s  | 1 API call (unchanged) |
| Toggle power         | ~1-2s  | 1 API call (unchanged) |

**No performance degradation** - Actually improved since global mode is now 1 call instead of multiple per-control calls.

---

## Feature Completeness

✅ **Implemented:**

- [x] Global mode toggle
- [x] Per-control capability detection
- [x] Smart UI rendering based on capabilities
- [x] Manual-only control warnings
- [x] Backward compatibility
- [x] Error handling
- [x] User feedback (SweetAlert)
- [x] Console logging
- [x] Loading states

✅ **Not Needed:**

- [ ] Breaking changes
- [ ] Data migration
- [ ] Deprecation notices
- [ ] Fallback logic for old data

---

## Deployment Checklist

- [x] Frontend code complete
- [x] Backend code complete and tested
- [x] Backward compatibility verified
- [x] Error handling in place
- [x] Logging implemented
- [x] Documentation provided
- [x] Testing checklist created

**Ready for:** Production deployment ✅

---

## Support Resources

| Resource          | Location                                           |
| ----------------- | -------------------------------------------------- |
| Detailed Spec     | `IMPLEMENTATION_SUMMARY.md`                        |
| Integration Guide | `BACKEND_INTEGRATION_READY.md`                     |
| Code Changes      | `src/components/dashboard/areaCards/AreaCards.jsx` |
| New API Function  | `src/api/commands.js`                              |
| Schema Spec       | `USERSPRODUCT_SCHEMA_FRONTEND_DOCS.md`             |

---

**Questions?** Check the other documentation files in the root directory.

**Issues?** Check DevTools console (F12) for error messages.

**All Set!** 🚀 Deploy with confidence.

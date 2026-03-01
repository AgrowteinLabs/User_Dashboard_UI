# 📊 Data Flow & Component Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface Layer                    │
│  AreaCards.jsx (Main Controller Management Component)        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
        ┌───────▼────────┐   ┌────────▼───────┐
        │ DISPLAY        │   │ USER ACTIONS   │
        │ - Product name │   │ - Toggle mode  │
        │ - Global mode  │   │ - Set threshold│
        │ - Controls     │   │ - Toggle power │
        │ - Capabilities │   │ - Save config  │
        └────────────────┘   └────────┬───────┘
                                      │
                ┌─────────────────────┴──────────────┐
                │                                    │
        ┌───────▼─────────┐              ┌──────────▼──────┐
        │  API Handler    │              │  State Manager  │
        │  - Proxy calls  │              │  - productDetails│
        │  - Error mgmt   │              │  - controlStates│
        │                 │              │  - thresholds   │
        └────────┬────────┘              └────────┬────────┘
                 │                                │
                 └─────────────┬──────────────────┘
                               │
                ┌──────────────▼───────────────┐
                │   BACKEND API LAYER         │
                │                             │
                │ POST /api/v1/product//mode │
                │ GET  /api/v1/user/product/ │
                │ POST /api/v1/command/...   │
                └──────────────┬──────────────┘
                               │
                ┌──────────────▼───────────────┐
                │   DATABASE / DEVICES        │
                │ - Product mode state        │
                │ - Control supportsAuto flag │
                │ - Control automate flag     │
                │ - Threshold/offset values   │
                │ - Current switch states     │
                └─────────────────────────────┘
```

---

## Data Structure Flow

### 1️⃣ Load Product (GET /api/v1/user/product/{userId})

```
Backend Response:
┌─────────────────────────────────────────┐
│ ProductDetails {                        │
│   uid: "ABC123"                         │
│   mode: "manual"  ⭐ NEW                 │
│   controls: [                           │
│     {                                   │
│       controlId: "pump1"                │
│       name: "Water Pump"                │
│       supportsAuto: true  ⭐ NEW         │
│       automate: true                    │
│       threshHold: 65                    │
│       state: "OFF"                      │
│     },                                  │
│     {                                   │
│       controlId: "light1"               │
│       name: "Grow Light"                │
│       supportsAuto: false  ⭐ NEW        │
│       automate: false (forced)          │
│       state: "OFF"                      │
│     }                                   │
│   ]                                     │
│ }                                       │
└─────────────────────────────────────────┘
         │
         │ Extract & Set State
         ▼
┌─────────────────────────────────────────┐
│ Component State {                       │
│   productDetails: {...above...}         │
│   mode: REMOVED ❌ (use productDetails) │
│   thresholds: {pump1: 65, ...}          │
│   offsets: {...}                        │
│   controlStates: {pump1: "OFF", ...}    │
│ }                                       │
└─────────────────────────────────────────┘
```

---

### 2️⃣ Toggle Global Mode (POST /api/v1/product/{uid}/mode)

```
USER CLICKS MODE TOGGLE
         │
         ▼
    ┌─────────────────────────────────┐
    │ handleModeToggle()              │
    │                                 │
    │ newMode = productDetails.mode   │
    │   === "manual"                  │
    │   ? "automate" : "manual"       │
    │                                 │
    │ setModeSwitchLoading(true)      │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ POST /api/v1/product/{uid}/mode │
    │ {                               │
    │   "mode": "automate"            │
    │ }                               │
    └────────────┬────────────────────┘
                 │
                 ▼◄─────────────────────────┐
    ┌─────────────────────────────────┐    │
    │ BACKEND PROCESSES:              │    │
    │                                 │    │
    │ 1. Set product.mode             │    │
    │                                 │    │
    │ 2. For each control:            │    │
    │    IF supportsAuto = true       │    │
    │    THEN set automate = true     │    │
    │    ELSE keep automate = false   │    │
    │                                 │    │
    │ 3. Return:                      │    │
    │ {                               │    │
    │   mode: "automate",             │    │
    │   updatedControls: ["C1","C2"], │    │
    │   skippedControls: ["C3"]       │ ───┘
    │ }                               │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ Show Success Message:           │
    │                                 │
    │ ✅ Mode Updated:                │
    │ Switched to AUTOMATE mode       │
    │ ✅ Updated: 2 controls          │
    │ ⏭️ Manual-only: 1 controls      │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ Refetch Product Details         │
    │ GET /api/v1/user/product/...    │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ Update Component State           │
    │ setProductDetails({...})        │
    │ setModeSwitchLoading(false)     │
    └────────────┬────────────────────┘
                 │
                 ▼
    ┌─────────────────────────────────┐
    │ Re-render UI with new data      │
    └─────────────────────────────────┘
```

---

### 3️⃣ Render Controls Based on Mode & Capability

```
FOR EACH CONTROL:

┌─────────────────────────────────────────────────────────┐
│ Check Conditions:                                       │
│                                                         │
│ productDetails.mode == "manual"                         │
│     AND                                                 │
│ control.supportsAuto == false                           │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│ Result: Show "🪜 Manual Only" badge                     │
│ ─────────────────────────────────────────────────────   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
     ┌──────────────────────────────────┐
     │ Control Card:                    │
     │                                  │
     │ Water Pump                       │
     │ Status: OFF                      │
     │ [TURN ON]                        │
     │ 🪜 Manual Control Only           │
     └──────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Check Conditions:                                       │
│                                                         │
│ productDetails.mode == "automate"                       │
│     AND                                                 │
│ control.supportsAuto == true                            │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│ Result: Show thresholds & offsets                       │
│ ─────────────────────────────────────────────────────   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
     ┌──────────────────────────────────┐
     │ Control Card:                    │
     │                                  │
     │ Water Pump                       │
     │ Threshold: ──●─── 65             │
     │ Offset:    ────●── 5             │
     │ [Save Configuration]             │
     └──────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Check Conditions:                                       │
│                                                         │
│ productDetails.mode == "automate"                       │
│     AND                                                 │
│ control.supportsAuto == false                           │
│                                                         │
│ ─────────────────────────────────────────────────────   │
│ Result: Show warning that it doesn't support auto      │
│ ─────────────────────────────────────────────────────   │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
     ┌──────────────────────────────────┐
     │ Control Card:                    │
     │                                  │
     │ Grow Light (Manual-only)         │
     │ ⚠️ This controller does not       │
     │ support automatic mode.          │
     │ Use manual controls to operate.  │
     └──────────────────────────────────┘
```

---

## State Transitions Diagram

```
                    Page Load
                       │
                       ▼
            ┌──────────────────────┐
            │  Fetch Product       │
            │  (mode + supportsAuto)
            └──────────┬───────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
     ┌─────────────┐          ┌──────────────┐
     │ Manual Mode │          │ Automate Mode│
     │             │          │              │
     │ Controls:   │          │ Controls:    │
     │ - Auto-cap: │          │ - Auto-cap:  │
     │   [ON/OFF]  │          │   [Threshold]
     │ - Manual-o: │          │ - Manual-o:  │
     │   [ON/OFF]  │          │   [Warning]  │
     └──────┬──────┘          └───────┬──────┘
            │                        │
            │ User clicks toggle     │ User clicks toggle
            │ "Automate"             │ "Manual"
            │                        │
            └────────────┬───────────┘
                         │
                         ▼
            ┌──────────────────────────┐
            │  POST /api/v1/product/   │
            │  {uid}/mode              │
            │  Request: {mode: "..."}  │
            │  Response: {             │
            │    mode,                 │
            │    updatedControls,      │
            │    skippedControls       │
            │  }                       │
            │  ↓                       │
            │  Refetch product         │
            │  Update UI               │
            └──────┬───────────────────┘
                   │
           ┌───────┴────────┐
           ▼                ▼
      Success           Error
      Show msg      Handle error
      Update UI     Refetch data
      (cycle back)  (try again)
```

---

## Component Props & State

```javascript
AreaCards Component:

┌─────────────────────────────────────┐
│ Props (from Context):               │
│ - selectedProductUid: string        │
│ - setSelectedProductUid: function   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ State:                              │
│                                     │
│ products: Array<Product>            │
│ productDetails: Product {           │
│   uid: string                       │
│   mode: "manual"|"automate" ⭐      │
│   controls: Control[] {             │
│     controlId: string               │
│     name: string                    │
│     supportsAuto: boolean ⭐        │
│     automate: boolean               │
│     state: "ON"|"OFF"|"ERROR"       │
│     threshHold: number              │
│     offset: number                  │
│   }                                 │
│ }                                   │
│                                     │
│ thresholds: { controlId: number }   │
│ offsets: { controlId: number }      │
│ controlStates: { controlId: string }│
│ expanded: boolean                   │
│ modeSwitchLoading: boolean ⭐       │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Methods:                            │
│                                     │
│ - fetchDetails()                    │
│   └─ Loads product from API         │
│                                     │
│ - handleModeToggle() ⭐ UPDATED    │
│   └─ Calls POST /api/v1/product/../mode
│                                     │
│ - handleSaveThreshold()             │
│   └─ Saves threshold value          │
│                                     │
│ - handleTogglePower()               │
│   └─ Toggles control ON/OFF         │
│                                     │
└─────────────────────────────────────┘
```

---

## API Request/Response Cycle

```javascript
// REQUEST
POST /api/v1/product/{ABC123}/mode
Headers: {
  "Content-Type": "application/json"
}
Body: {
  "mode": "automate"
}

// PROCESSING
Backend:
1. Find product ABC123
2. Set product.mode = "automate"
3. For each control:
   - If supportsAuto = true: set automate = true
   - If supportsAuto = false: leave automate = false
4. Save changes
5. Collect updatedControls and skippedControls arrays
6. Return result

// RESPONSE (200 OK)
{
  "uid": "ABC123",
  "mode": "automate",
  "updatedControls": ["C1", "C2", "C3"],
  "skippedControls": ["C4"]
}

// FRONTEND PROCESSING
1. Parse response
2. Check if response.ok
3. If error: throw and handle
4. Log to console (debug)
5. Refetch product details
6. Update productDetails state
7. Re-render with new data
8. Show success message
```

---

## Key Points

✅ **Mode is now at product level** - Not derived from controls
✅ **Capabilities are explicit** - Each control declares supportsAuto
✅ **Backend is smart** - Only updates controls with capability
✅ **Frontend responds** - Shows correct UI per capability
✅ **Data flows from backend to UI** - Single source of truth
✅ **No breaking changes** - Old data works with new system

---

**Generated:** February 27, 2026  
**Component:** AreaCards.jsx  
**Status:** Production Ready ✅

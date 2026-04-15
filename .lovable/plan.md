

## Plan: Fix Client Tutorial — Fluid, Bug-Free, Apple-Style

### Problems Found

1. **Infinite loop**: `startTour` in Home.tsx's `useEffect` dependency array gets recreated each render, and profile state doesn't update immediately after tour completion, causing re-triggers.
2. **Steps 3-5 are broken**: They depend on navigating to a product detail page and chat with real data — impossible with an empty database. The tour gets stuck trying to find elements that don't exist.
3. **No guard against re-triggering**: No local flag to prevent the tour from starting multiple times in the same session.
4. **Transitions aren't smooth**: Missing CSS animations for step changes.

### Solution

**Simplify the tour to 5 self-contained steps** that work regardless of database state:

| Step | Type | Content |
|------|------|---------|
| 1 | Modal | Welcome — explain Nellor |
| 2 | Spotlight | Search bar on Home (`home-search-bar`) |
| 3 | Spotlight | Product card on Home (`product-card`) — fallback to modal if none exist |
| 4 | Spotlight | Chat nav button (`chat-nav`) |
| 5 | Modal | Conclusion — ready to explore |

Remove cross-page navigation entirely (no navigating to product detail or chat pages during the tour).

### Files to Change

**`src/components/cliente/ClientOnboardingTour.tsx`** — Full rewrite:
- Reduce to 5 steps, all on `/cliente` except chat-nav which is always visible
- Remove `productRoute` and `tutorialSupplierId` state (no cross-page navigation)
- Add CSS transitions between steps (`animate-in fade-in` with duration)
- Add `isAnimating` state to prevent rapid clicking
- Improve fallback: if spotlight target not found after retries, show step as centered modal card (already exists but ensure it works)

**`src/pages/cliente/Home.tsx`** — Fix auto-start:
- Add `useRef(false)` guard (`tourStartedRef`) to prevent multiple triggers
- Remove `startTour` from `useEffect` dependency array (use ref pattern)
- Check `sessionStorage` flag to avoid re-showing after skip in same session

**`src/hooks/useClientOnboardingTour.tsx`** — Stabilize callbacks:
- Wrap `startTour`, `endTour`, `triggerRestart` in `useCallback` so they have stable references

**`src/index.css`** — Add smooth step transition keyframe:
- Add a subtle `tour-step-enter` animation for card appearance

### Animation Details
- Step transitions: 280ms fade + slide-up
- Spotlight movement: CSS transition on position/size (200ms ease-out)
- Progress bar: `transition-all duration-500 ease-out`
- Overlay: `transition-opacity duration-300`


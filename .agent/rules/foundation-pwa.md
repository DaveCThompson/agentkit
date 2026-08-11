---
trigger: model-decision
description: Consult when touching PWA concerns — virtual keyboard handling, offline detection, install experience, manifest standards, service-worker update mode, cache security, binary persistence.
tier: tech:pwa
domain: transport
---

# PWA Foundations

Standards for Progressive Web App features, offline support, and installability.

## 0. Virtual Keyboard Handling (Solution B)
*   **Android Standard:** Use `interactive-widget=resizes-content` in the viewport meta tag for native layout resizing.
*   **iOS Standard:** Do not shrink first-party shell layouts to `visualViewport.height`. Let Safari handle focused-field panning natively, and use `useVisualViewport` only for a best-effort `data-keyboard-open="true"` fallback signal on `<html>`.
*   **CSS Contract:**
    *   Global footer visibility during text entry MUST hide only when both editable-focus intent and keyboard-presence are true (`[data-text-editing-active="true"][data-keyboard-open="true"]`).
    *   `[data-keyboard-open="true"]` remains a fallback signal for extra chrome/runway adjustments on overlay-keyboard platforms.
    *   In-app shell layouts SHOULD prefer stable viewport sizing such as `100svh` instead of JS-driven visual viewport height.
    *   Transition hidden elements with `translate` for performance; move `transition` to the **base** class so both Directions are animated.

## 1. Offline Detection
*   **Hook Pattern:** Use `useOnlineStatus` hook for unified connection monitoring.
*   **UI Banner:** 
    *   Display a persistent, non-blocking banner when offline.
    *   **Accessibility:** MUST use `role="status"` and `aria-live="polite"` for offline notifications.
    *   **Animation:** Use `slideDown` entrance animation for better visibility.
    *   **Z-Index:** Ensure banners use native-tier positioning below headers.

## 2. Install Experience
*   **Headless Pattern:** Use headless components (e.g., `InstallPrompt.tsx`) to capture `beforeinstallprompt` events.
*   **Toast Integration:** Prefer using the existing toast system for install prompts instead of intrusive modals or browser defaults.
*   **Persistence:** Install toasts SHOULD be persistent (`persistent: true`) to wait for user choice.

## 3. Manifest Standards
*   **Identification:** Always provide a stable `id: "/"` in the manifest configuration.
*   **Native Integration:**
    *   Implement `shortcuts` for common actions (e.g., "New Prompt").
    *   Define `categories` to improve app store/launcher discoverability.
    *   Use `display_override: ['window-controls-overlay', 'standalone']` for modern OS support.


## 4. Service Worker Update Mode
*   **AutoUpdate:** Use `registerType: 'autoUpdate'` (not `'prompt'`) so the PWA updates without user interaction. Prompt-based updates can strand users on a broken cached shell if the crashed app never renders the update toast.
*   **Crash Recovery:** Always enable `skipWaiting` and `clientsClaim` in the Workbox config. This ensures a new service worker takes control immediately after installation.
*   **SW Registration:** Register the service worker before the React tree renders (side-effect import in `main.tsx`). The registration is synchronous enough to complete before React hydration.

## 5. Cache Security
*   **No API Caching:** Never cache sensitive API response bodies (e.g. LLM-proxy or transcription endpoints) in the service worker. They contain sensitive user data.
*   **Legacy Purge:** On SW registration, purge any legacy sensitive `api-cache` entries from Cache Storage to remove previously cached sensitive data.
*   **Voice Assets:** Voice engine binaries (`*.onnx`, `*.wasm`, `*.mjs`, `vad.worklet.bundle.min.js`) are runtime-cached with a bounded `voice-engine-assets` cache (StaleWhileRevalidate, 8 entries max, 30-day TTL). Lazy voice/ZIP JS chunks are runtime-cached with `lazy-engine-assets` (CacheFirst, 8 entries max, 30-day TTL). Both groups are excluded from precache via `globIgnores`.

## 6. Binary Data Persistence
*   **No Ephemeral URLs:** NEVER store `blob:` URLs in persistent state (atoms, localStorage). They are session-bound and break on reload.
*   **IndexedDB Pattern:** Store actual `Blob` objects in IndexedDB (via Dexie.js).
*   **Hook Pattern:** Use `usePersistedImage(id)` hook for centralized blob URL lifecycle management (creation and revocation).
*   **Storage Persistence Request:** 
    *   Sites MUST request persistent storage via `navigator.storage.persist()` to protect critical credentials (API keys, session) from automatic browser cleanup.
    *   Provide a "Storage Health" UI in settings to show current status and allow manual re-request.
*   **Migration Layer:** Always provide a fallback/migration path for legacy storage formats (e.g., base64 strings) when upgrading persistence schemas.

## 7. Verification
*   **Production Check:** PWA features MUST be verified using `npm run build` and `npm run preview`.
*   **Lighthouse:** Target a PWA Lighthouse score of 90+.
*   **Hard Reload Test:** Verify that stateful binary data (like uploaded images) survives a hard browser refresh.

## 8. Media & Hardware (Mobile Strictness)
*   **User Gesture Constraint:** Mobile browsers (Android Chrome/WebAPK) strictly expire a "user gesture" (click/tap) if too much asynchronous work (`await`) happens before initializing hardware.
*   **Immediate Initialization Pattern:** 
    *   `AudioContext` MUST be created and `resume()` called synchronously or within the first tick of the user event handler.
    *   Initialize `AudioContext` and `AnalyserNode` **BEFORE** calling `navigator.mediaDevices.getUserMedia`. 
    *   NEVER perform `await` logic (like `navigator.permissions.query`) in the critical path between the user click and hardware initialization.
*   **Sensitivity & Auto Gain:** Always explicitly request `autoGainControl: true` in the `getUserMedia` audio constraints for mobile reliability.
*   **State Conflict:** On mobile, ensure `MediaRecorder` and `AudioContext` do not compete for exclusive hardware control by starting the visualizer loop immediately after acquiring the stream.

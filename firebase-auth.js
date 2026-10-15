/* ==========================================
   PREACH MATE — FIREBASE AUTH & DRAWER BARS
   Login • Register • Google • Clean Layout
   ========================================== */

(function () {
  "use strict";

  const firebaseConfig = {
    apiKey: "AIzaSyBLXaXG8EcxhGxqZCkFiqzLp9uF7vnYZS0",
    authDomain: "preach-mate.firebaseapp.com",
    projectId: "preach-mate",
    storageBucket: "preach-mate.firebasestorage.app",
    messagingSenderId: "977514996603",
    appId: "1:977514996603:web:76f5a961497af7dcb553de"
  };

  let auth = null;
  let db = null;
  let currentUser = null;
  let authReady = false;
  let authBusy = false;

  function showToast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }

    let toast = document.getElementById("pm-auth-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "pm-auth-toast";
      toast.style.cssText = `
        position:fixed; left:50%; bottom:28px; transform:translateX(-50%);
        z-index:1000000; max-width:90%; padding:12px 18px; border-radius:12px;
        background:#27272a; color:#fff; font-size:14px; box-shadow:0 5px 24px #0005;
        display:none; text-align:center;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = "block";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.display = "none"; }, 3500);
  }

  function getFriendlyError(error) {
    const code = error && error.code ? error.code : "";
    const messages = {
      "auth/invalid-email": "Invalid email address.",
      "auth/user-not-found": "Walang account sa email na ito.",
      "auth/wrong-password": "Incorrect password.",
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/network-request-failed": "Network error. Tingnan ang internet connection.",
      "auth/popup-closed-by-user": "Isinara ang Google sign-in window.",
      "auth/popup-blocked": "Na-block ang Google sign-in popup."
    };
    return messages[code] || (error && error.message ? error.message : "May naganap na error. Subukan muli.");
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function initFirebase() {
    try {
      if (!window.firebase) return false;
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      auth = firebase.auth();
      if (typeof firebase.firestore === "function") {
        db = firebase.firestore();
      }

      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          auth.onAuthStateChanged(
            function (user) {
              currentUser = user || null;
              authReady = true;

              renderAccountPanel();

              window.dispatchEvent(
                new CustomEvent("preachmate:auth-state-changed", {
                  detail: { user: currentUser }
                })
              );
            },
            function (error) {
              console.error("Auth state error:", error);
            }
          );
        })
        .catch(err => console.error("Persistence error:", err));

      return true;
    } catch (error) {
      console.error("Firebase init error:", error);
      return false;
    }
  }

  function injectStyles() {
    if (document.getElementById("pm-auth-styles")) return;

    const style = document.createElement("style");
    style.id = "pm-auth-styles";
    style.textContent = `
      /* TOP DRAWER BACKUP BAR (LOGGED OUT) */
      #pm-top-backup-bar {
        background: linear-gradient(135deg, #d97706, #b45309);
        color: #ffffff;
        padding: 10px 14px;
        margin: -16px -16px 12px -16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      #pm-top-backup-bar:hover {
        background: linear-gradient(135deg, #f59e0b, #d97706);
      }
      .pm-backup-btn-text {
        background: #ffffff;
        color: #b45309;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.5px;
      }

      /* BOTTOM DRAWER ACCOUNT PANEL (LOGGED IN) */
      #pm-account-panel {
        margin-top: auto;
        padding: 12px 14px;
        border-radius: 12px;
        background: rgba(128,128,128,.1);
        border: 1px solid rgba(128,128,128,.2);
      }
      .pm-account-title { font-size: 13px; font-weight: 700; color: #34d399; margin-bottom: 3px; }
      .pm-account-subtitle { font-size: 12px; opacity: .8; line-height: 1.4; overflow-wrap: anywhere; margin-bottom: 10px; }
      
      .pm-auth-button {
        width: 100%; min-height: 40px; padding: 8px 12px; border: 1px solid rgba(128,128,128,.25);
        border-radius: 10px; background: transparent; color: inherit; font: inherit;
        font-size: 13px; font-weight: 600; cursor: pointer; text-align: center;
      }
      .pm-auth-danger { color: #ef4444; border-color: rgba(239,68,68,0.3); }
      .pm-auth-danger:hover { background: rgba(239,68,68,0.1); }

      /* AUTH MODAL STYLES */
      #pm-auth-overlay {
        position: fixed; inset: 0; z-index: 999990; display: none;
        align-items: center; justify-content: center; padding: 16px;
        background: rgba(0,0,0,.80); backdrop-filter: blur(6px);
      }
      #pm-auth-overlay.pm-auth-visible { display: flex; }

      #pm-auth-modal {
        width: 100%; max-width: 400px; max-height: 90vh; overflow-y: auto;
        position: relative; padding: 22px; border-radius: 18px;
        background: #18181b; color: #f9fafb; border: 1px solid #3f3f46;
        box-shadow: 0 20px 70px rgba(0,0,0,.6); font-family: inherit;
      }

      .pm-auth-google-priority {
        background: #ffffff; color: #1f2937; border: 2px solid #e5e7eb;
        font-size: 14px; font-weight: 700; display: flex; align-items: center;
        justify-content: center; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .pm-auth-close {
        position: absolute; top: 12px; right: 12px; border: 0; background: #27272a;
        color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px;
      }
      .pm-auth-field { display: block; margin-bottom: 12px; }
      .pm-auth-field span { display: block; margin-bottom: 5px; font-size: 12px; color: #a1a1aa; }
      .pm-auth-field input {
        width: 100%; min-height: 42px; padding: 10px; border: 1px solid #3f3f46;
        border-radius: 8px; outline: none; background: #27272a; color: #fff; font: inherit; font-size: 13px;
      }
      .pm-auth-divider { display: flex; align-items: center; gap: 10px; margin: 14px 0; color: #71717a; font-size: 11px; }
      .pm-auth-divider::before, .pm-auth-divider::after { content: ""; flex: 1; height: 1px; background: #27272a; }
    `;
    document.head.appendChild(style);
  }

  function findDrawer() {
    return (
      document.querySelector(".drawer") ||
      document.querySelector("#drawer") ||
      document.querySelector(".drawer-content") ||
      document.querySelector("#drawer-content") ||
      document.querySelector(".sidebar")
    );
  }

  function renderAccountPanel() {
    const drawer = findDrawer();
    if (!drawer) return;

    let topBar = document.getElementById("pm-top-backup-bar");
    let bottomPanel = document.getElementById("pm-account-panel");

    if (!currentUser) {
      // 1. LOGGED OUT STATE: ipakita ang Top Bar overlays
      if (!topBar) {
        topBar = document.createElement("div");
        topBar.id = "pm-top-backup-bar";
        topBar.innerHTML = `
          <span>☁️ Back up your files</span>
          <span class="pm-backup-btn-text">SIGN IN</span>
        `;
        topBar.onclick = () => openAuthDialog("login");
        drawer.insertBefore(topBar, drawer.firstChild);
      } else {
        topBar.style.display = "flex";
      }

      // Itago ang bottom panel kapag logged out
      if (bottomPanel) bottomPanel.style.display = "none";

    } else {
      // 2. SIGNED IN STATE: Itago ang Top Bar at lumipat sa Bottom Footer Panel
      if (topBar) topBar.style.display = "none";

      if (!bottomPanel) {
        bottomPanel = document.createElement("section");
        bottomPanel.id = "pm-account-panel";
        drawer.appendChild(bottomPanel);
      } else {
        bottomPanel.style.display = "block";
      }

      const email = escapeHTML(currentUser.email || currentUser.displayName || "Preach Mate User");

      bottomPanel.innerHTML = `
        <div class="pm-account-title">✓ SIGNED IN</div>
        <div class="pm-account-subtitle">${email}</div>
        <button type="button" class="pm-auth-button pm-auth-danger" id="pm-logout-button">Log Out</button>
      `;

      document.getElementById("pm-logout-button").onclick = logout;
    }
  }

  function ensureAuthDialog() {
    let overlay = document.getElementById("pm-auth-overlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.id = "pm-auth-overlay";

    overlay.innerHTML = `
      <div id="pm-auth-modal" role="dialog" aria-modal="true">
        <button type="button" class="pm-auth-close" id="pm-auth-close">&times;</button>
        
        <div style="text-align:center; margin-bottom:16px;">
          <h2 style="margin:0 0 6px; font-size:20px;">Preach Mate Backup</h2>
          <p style="margin:0; font-size:12px; color:#a1a1aa;">Sign in to back up your sermons and sync notes across devices.</p>
        </div>

        <!-- PRIORITY: GOOGLE LOGIN -->
        <button type="button" id="pm-google-button" class="pm-auth-button pm-auth-google-priority">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
          Continue with Google
        </button>

        <div class="pm-auth-divider">OR LOGIN WITH EMAIL</div>

        <form id="pm-auth-form" novalidate>
          <label class="pm-auth-field">
            <span>Email Address</span>
            <input type="email" id="pm-auth-email" placeholder="you@example.com" required>
          </label>

          <label class="pm-auth-field">
            <span>Password</span>
            <input type="password" id="pm-auth-password" placeholder="Enter password" required>
          </label>

          <button type="submit" id="pm-auth-submit" class="pm-auth-button" style="background:#d97706; color:#fff; border:none; margin-top:6px;">
            Log In
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("pm-auth-close").onclick = closeAuthDialog;
    document.getElementById("pm-auth-form").onsubmit = handleAuthSubmit;
    document.getElementById("pm-google-button").onclick = signInWithGoogle;

    return overlay;
  }

  function openAuthDialog() {
    injectStyles();
    const overlay = ensureAuthDialog();
    overlay.classList.add("pm-auth-visible");
    document.body.style.overflow = "hidden";
  }

  function closeAuthDialog() {
    const overlay = document.getElementById("pm-auth-overlay");
    if (overlay) overlay.classList.remove("pm-auth-visible");
    document.body.style.overflow = "";
  }

  async function signInWithGoogle() {
    if (authBusy || !auth) return;
    setAuthBusy(true);
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await auth.signInWithPopup(provider);
      currentUser = result.user || null;
      closeAuthDialog();
      renderAccountPanel();
      showToast("Signed in successfully!");
    } catch (error) {
      showToast(getFriendlyError(error));
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    if (authBusy || !auth) return;

    setAuthBusy(true);
    const email = document.getElementById("pm-auth-email").value.trim();
    const password = document.getElementById("pm-auth-password").value;

    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      currentUser = result.user || null;
      closeAuthDialog();
      renderAccountPanel();
      showToast("Logged in successfully!");
    } catch (error) {
      showToast(getFriendlyError(error));
    } finally {
      setAuthBusy(false);
    }
  }

  function setAuthBusy(busy) {
    authBusy = Boolean(busy);
    const submit = document.getElementById("pm-auth-submit");
    const google = document.getElementById("pm-google-button");
    if (submit) submit.disabled = authBusy;
    if (google) google.disabled = authBusy;
  }

  async function logout() {
    if (!auth) return;
    if (!window.confirm("Mag-logout sa Preach Mate account?")) return;
    try {
      await auth.signOut();
      currentUser = null;
      renderAccountPanel();
      showToast("Logged out successfully.");
    } catch (error) {
      showToast(getFriendlyError(error));
    }
  }

  function start() {
    injectStyles();
    ensureAuthDialog();
    initFirebase();
  }

  window.PreachMateFirebase = {
    initFirebase: initFirebase,
    openAuthDialog: openAuthDialog,
    closeAuthDialog: closeAuthDialog,
    signInWithGoogle: signInWithGoogle,
    logout: logout,
    getCurrentUser: () => currentUser,
    getFirestore: () => db,
    isReady: () => authReady
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

})();

/* ==========================================
   PREACH MATE — FIREBASE AUTH & WARNING MODAL
   Login • Google (Redirect) • Backup Notice • Skip Flow
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
  let userSkippedLogin = false;

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

      // Saluhin ang redirect result pagbalik galing sa Google Login
      auth.getRedirectResult().then((result) => {
        if (result && result.user) {
          currentUser = result.user;
          userSkippedLogin = false;
          closeAuthDialog();
          closeWarningDialog();
          renderAccountPanel();
          renderTopSyncBadge();
          showToast("Signed in successfully with Google!");
        }
      }).catch((error) => {
        console.error("Redirect login error:", error);
        showToast(getFriendlyError(error));
      });

      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          auth.onAuthStateChanged(
            function (user) {
              currentUser = user || null;
              authReady = true;

              renderAccountPanel();
              renderTopSyncBadge();

              if (!currentUser && !userSkippedLogin) {
                setTimeout(() => {
                  openAuthDialog();
                }, 500);
              } else if (currentUser) {
                closeAuthDialog();
                closeWarningDialog();
              }

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
      #pm-top-backup-bar {
        background: linear-gradient(135deg, #d97706, #b45309);
        color: #ffffff; padding: 10px 14px; margin: -16px -16px 12px -16px;
        display: flex; align-items: center; justify-content: space-between;
        font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      .pm-backup-btn-text {
        background: #ffffff; color: #b45309; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800;
      }
      #pm-account-panel {
        margin-top: auto; padding: 12px 14px; border-radius: 12px;
        background: rgba(128,128,128,.1); border: 1px solid rgba(128,128,128,.2);
      }
      .pm-account-title { font-size: 13px; font-weight: 700; color: #34d399; margin-bottom: 3px; }
      .pm-account-subtitle { font-size: 12px; opacity: .8; line-height: 1.4; overflow-wrap: anywhere; margin-bottom: 10px; }
      .pm-auth-button {
        width: 100%; min-height: 42px; padding: 10px 13px; border: 1px solid rgba(128,128,128,.25);
        border-radius: 10px; background: transparent; color: inherit; font: inherit;
        font-size: 13px; font-weight: 600; cursor: pointer; text-align: center;
      }
      .pm-auth-danger { color: #ef4444; border-color: rgba(239,68,68,0.3); }
      #pm-auth-overlay, #pm-warning-overlay {
        position: fixed; inset: 0; z-index: 999990; display: none;
        align-items: center; justify-content: center; padding: 16px;
        background: rgba(0,0,0,.80); backdrop-filter: blur(6px);
      }
      #pm-auth-overlay.pm-auth-visible, #pm-warning-overlay.pm-auth-visible { display: flex; }
      #pm-auth-modal, #pm-warning-modal {
        width: 100%; max-width: 420px; max-height: 90vh; overflow-y: auto;
        position: relative; padding: 24px; border-radius: 20px;
        background: #18181b; color: #f9fafb; border: 1px solid #3f3f46;
        box-shadow: 0 20px 70px rgba(0,0,0,.6); font-family: inherit; text-align: center;
      }
      .pm-auth-google-priority {
        background: #ffffff; color: #1f2937; border: 2px solid #e5e7eb;
        font-size: 14px; font-weight: 700; display: flex; align-items: center;
        justify-content: center; gap: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 16px;
      }
      .pm-auth-field { display: block; margin-bottom: 12px; text-align: left; }
      .pm-auth-field span { display: block; margin-bottom: 5px; font-size: 12px; color: #a1a1aa; }
      .pm-auth-field input {
        width: 100%; min-height: 42px; padding: 10px; border: 1px solid #3f3f46;
        border-radius: 8px; outline: none; background: #27272a; color: #fff; font: inherit; font-size: 13px;
      }
      .pm-auth-divider { display: flex; align-items: center; gap: 10px; margin: 16px 0; color: #71717a; font-size: 11px; }
      .pm-auth-divider::before, .pm-auth-divider::after { content: ""; flex: 1; height: 1px; background: #27272a; }
      #pm-topbar-badge {
        position: absolute; right: 14px; top: 12px; z-index: 100;
        background: #78350f; color: #fef3c7; border: 1px solid #d97706;
        padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
        cursor: pointer; display: none; align-items: center; gap: 5px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
    `;
    document.head.appendChild(style);
  }

  function findDrawer() {
    return (
      document.querySelector(".drawer") ||
      document.querySelector("#drawer") ||
      document.querySelector(".sidebar")
    );
  }

  function renderTopSyncBadge() {
    let badge = document.getElementById("pm-topbar-badge");
    const topbar = document.querySelector(".topbar") || document.querySelector("header") || document.body;

    if (!currentUser && userSkippedLogin) {
      if (!badge) {
        badge = document.createElement("button");
        badge.id = "pm-topbar-badge";
        badge.innerHTML = `⚠️ Not Synced`;
        badge.onclick = () => openAuthDialog();
        topbar.appendChild(badge);
      }
      badge.style.display = "flex";
    } else {
      if (badge) badge.style.display = "none";
    }
  }

  function renderAccountPanel() {
    const drawer = findDrawer();
    if (!drawer) return;

    let topBar = document.getElementById("pm-top-backup-bar");
    let bottomPanel = document.getElementById("pm-account-panel");

    if (!currentUser) {
      if (!topBar) {
        topBar = document.createElement("div");
        topBar.id = "pm-top-backup-bar";
        topBar.innerHTML = `
          <span>☁️ Back up your files</span>
          <span class="pm-backup-btn-text">SIGN IN</span>
        `;
        topBar.onclick = () => openAuthDialog();
        drawer.insertBefore(topBar, drawer.firstChild);
      } else {
        topBar.style.display = "flex";
      }
      if (bottomPanel) bottomPanel.style.display = "none";
    } else {
      if (topBar) topBar.style.display = "none";
      if (!bottomPanel) {
        bottomPanel = document.createElement("section");
        bottomPanel.id = "pm-account-panel";
        drawer.appendChild(bottomPanel);
      } else {
        bottomPanel.style.display = "block";
      }

      const email = escapeHTML(currentUser.email || currentUser.displayName || "User");
      bottomPanel.innerHTML = `
        <div class="pm-account-title">✓ SIGNED IN</div>
        <div class="pm-account-subtitle">${email}</div>
        <button type="button" class="pm-auth-button pm-auth-danger" id="pm-logout-button">Log Out</button>
      `;
      document.getElementById("pm-logout-button").onclick = logout;
    }
  }

  function ensureAuthDialogs() {
    let overlay = document.getElementById("pm-auth-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "pm-auth-overlay";
      overlay.innerHTML = `
        <div id="pm-auth-modal" role="dialog">
          <div style="font-size:36px; margin-bottom:8px;">☁️</div>
          <h2 style="margin:0 0 6px; font-size:20px;">Back Up Your Notes</h2>
          <p style="margin:0 0 18px; font-size:12px; color:#a1a1aa; line-height:1.4;">
            Log in your account to avoid losing your notes. Log in your email for backup.
          </p>

          <button type="button" id="pm-google-button" class="pm-auth-button pm-auth-google-priority">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Continue with Google
          </button>

          <div class="pm-auth-divider">OR EMAIL & PASSWORD</div>

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
              Log In with Email
            </button>
          </form>

          <div style="margin-top:16px;">
            <button type="button" id="pm-auth-skip" style="background:none; border:none; color:#71717a; font-size:12px; text-decoration:underline; cursor:pointer;">
              SKIP
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      document.getElementById("pm-auth-form").onsubmit = handleAuthSubmit;
      document.getElementById("pm-google-button").onclick = signInWithGoogle;
      
      document.getElementById("pm-auth-skip").onclick = () => {
        closeAuthDialog();
        openWarningDialog();
      };
    }

    let warnOverlay = document.getElementById("pm-warning-overlay");
    if (!warnOverlay) {
      warnOverlay = document.createElement("div");
      warnOverlay.id = "pm-warning-overlay";
      warnOverlay.innerHTML = `
        <div id="pm-warning-modal" role="dialog">
          <div style="font-size:32px; margin-bottom:8px;">⚠️</div>
          <h2 style="margin:0 0 8px; font-size:18px; color:#fef08a;">Unsaved Backup Warning</h2>
          <p style="margin:0 0 20px; font-size:13px; color:#d4d4d8; line-height:1.5;">
            Your notes are NOT backed up. Any edits will only stay on this browser until you log in.
          </p>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <button type="button" id="pm-warn-login" class="pm-auth-button" style="background:#d97706; color:#fff; border:none;">
              Log In Now
            </button>
            <button type="button" id="pm-warn-continue" class="pm-auth-button" style="background:#27272a; color:#a1a1aa; border:1px solid #3f3f46;">
              Continue Without Backup
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(warnOverlay);

      document.getElementById("pm-warn-login").onclick = () => {
        closeWarningDialog();
        openAuthDialog();
      };

      document.getElementById("pm-warn-continue").onclick = () => {
        userSkippedLogin = true;
        closeWarningDialog();
        renderTopSyncBadge();
        showToast("⚠️ Running without cloud backup.");
      };
    }
  }

  function openAuthDialog() {
    injectStyles();
    ensureAuthDialogs();
    closeWarningDialog();
    document.getElementById("pm-auth-overlay").classList.add("pm-auth-visible");
    document.body.style.overflow = "hidden";
  }

  function closeAuthDialog() {
    const overlay = document.getElementById("pm-auth-overlay");
    if (overlay) overlay.classList.remove("pm-auth-visible");
    document.body.style.overflow = "";
  }

  function openWarningDialog() {
    injectStyles();
    ensureAuthDialogs();
    document.getElementById("pm-warning-overlay").classList.add("pm-auth-visible");
    document.body.style.overflow = "hidden";
  }

  function closeWarningDialog() {
    const overlay = document.getElementById("pm-warning-overlay");
    if (overlay) overlay.classList.remove("pm-auth-visible");
    document.body.style.overflow = "";
  }

  // PWA-FRIENDLY GOOGLE SIGN IN GAMIT ANG REDIRECT
  async function signInWithGoogle() {
    if (authBusy || !auth) return;
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await auth.signInWithRedirect(provider);
    } catch (error) {
      showToast(getFriendlyError(error));
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    if (authBusy || !auth) return;

    const email = document.getElementById("pm-auth-email").value.trim();
    const password = document.getElementById("pm-auth-password").value;

    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      currentUser = result.user || null;
      userSkippedLogin = false;
      closeAuthDialog();
      closeWarningDialog();
      renderAccountPanel();
      renderTopSyncBadge();
      showToast("Logged in successfully!");
    } catch (error) {
      showToast(getFriendlyError(error));
    }
  }

  async function logout() {
    if (!auth) return;
    if (!window.confirm("Mag-logout sa Preach Mate account?")) return;
    try {
      await auth.signOut();
      currentUser = null;
      userSkippedLogin = false;
      renderAccountPanel();
      renderTopSyncBadge();
      showToast("Logged out successfully.");
      openAuthDialog();
    } catch (error) {
      showToast(getFriendlyError(error));
    }
  }

  function start() {
    injectStyles();
    ensureAuthDialogs();
    initFirebase();
  }

  window.PreachMateFirebase = {
    initFirebase: initFirebase,
    openAuthDialog: openAuthDialog,
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

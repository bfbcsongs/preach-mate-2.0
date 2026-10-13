/* ==========================================
   PREACH MATE — FIREBASE AUTHENTICATION
   Email / Password
   ========================================== */

(() => {
  "use strict";

  const firebaseConfig = {
    apiKey: "AIzaSyBLXaXG8EcxhGxqZCkFiqzLp9uF7vnYZS0",
    authDomain: "preach-mate.firebaseapp.com",
    projectId: "preach-mate",
    storageBucket: "preach-mate.firebasestorage.app",
    messagingSenderId: "977514996603",
    appId: "1:977514996603:web:76f5a961497af7dcb553de"
  };

  let auth;
  let currentUser = null;
  let authReady = false;

  function initFirebase() {
    if (!window.firebase) {
      console.error("Preach Mate: Firebase SDK failed to load.");
      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      auth = firebase.auth();

      auth.onAuthStateChanged(user => {
        currentUser = user || null;
        authReady = true;
        updateAccountPanel();
      });

    } catch (error) {
      console.error("Preach Mate Firebase:", error);
      showMessage("Hindi makakonekta sa Firebase.");
    }
  }

  function injectStyles() {
    if (document.getElementById("pm-auth-styles")) return;

    const style = document.createElement("style");
    style.id = "pm-auth-styles";

    style.textContent = `
      .pm-account-panel {
        margin: 10px 0;
        padding: 14px;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        background: #f9fafb;
      }

      .pm-account-heading {
        font-size: 14px;
        font-weight: 800;
        margin-bottom: 7px;
        color: #111827;
      }

      .pm-account-email {
        font-size: 12px;
        line-height: 1.5;
        overflow-wrap: anywhere;
        color: #4b5563;
        margin-bottom: 10px;
      }

      .pm-account-status {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 10px;
        line-height: 1.5;
      }

      .pm-account-btn {
        width: 100%;
        min-height: 42px;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 9px;
        background: white;
        color: #111827;
        font-size: 14px;
        font-weight: 700;
        margin-top: 7px;
        text-align: center;
      }

      .pm-account-btn.primary {
        background: #2563eb;
        border-color: #2563eb;
        color: white;
      }

      .pm-account-btn.danger {
        color: #dc2626;
      }

      .pm-auth-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(0,0,0,.55);
      }

      .pm-auth-dialog {
        width: 100%;
        max-width: 380px;
        max-height: 90dvh;
        overflow-y: auto;
        padding: 22px;
        border-radius: 17px;
        background: white;
        color: #111827;
        box-shadow: 0 15px 45px rgba(0,0,0,.25);
      }

      .pm-auth-dialog h2 {
        margin: 0 0 7px;
        font-size: 22px;
      }

      .pm-auth-description {
        color: #6b7280;
        font-size: 13px;
        line-height: 1.5;
        margin-bottom: 18px;
      }

      .pm-auth-dialog label {
        display: block;
        font-size: 13px;
        font-weight: 700;
        margin: 12px 0 6px;
      }

      .pm-auth-dialog input {
        width: 100%;
        min-width: 0;
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 9px;
        outline: none;
        background: white;
        color: #111827;
        font-size: 16px;
      }

      .pm-auth-dialog input:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px #2563eb22;
      }

      .pm-auth-error {
        display: none;
        margin-top: 12px;
        padding: 10px;
        border-radius: 8px;
        background: #fee2e2;
        color: #991b1b;
        font-size: 13px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .pm-auth-actions {
        display: flex;
        gap: 8px;
        margin-top: 20px;
      }

      .pm-auth-actions button {
        flex: 1;
        min-height: 43px;
        padding: 10px;
        border: 1px solid #d1d5db;
        border-radius: 9px;
        background: white;
        color: #111827;
        font-size: 14px;
        font-weight: 700;
      }

      .pm-auth-actions button.primary {
        background: #2563eb;
        border-color: #2563eb;
        color: white;
      }

      .pm-auth-actions button:disabled {
        opacity: .6;
        cursor: wait;
      }

      .pm-auth-forgot {
        display: block;
        margin-top: 12px;
        padding: 7px 0;
        border: 0;
        background: transparent;
        color: #2563eb;
        font-size: 13px;
        text-align: left;
      }
    `;

    document.head.appendChild(style);
  }

  function createAccountPanel() {
    if (document.getElementById("pmAccountPanel")) return;

    const drawer = document.querySelector(".drawer");

    if (!drawer) {
      console.error(
        "Preach Mate: Could not find the existing drawer."
      );
      return;
    }

    const panel = document.createElement("section");
    panel.id = "pmAccountPanel";
    panel.className = "pm-account-panel";

    const drawerTitle = drawer.querySelector(".drawer-title");

    if (drawerTitle && drawerTitle.parentElement) {
      drawerTitle.parentElement.insertAdjacentElement(
        "afterend",
        panel
      );
    } else {
      drawer.prepend(panel);
    }

    updateAccountPanel();
  }

  function updateAccountPanel() {
    const panel = document.getElementById("pmAccountPanel");

    if (!panel) return;

    if (!authReady) {
      panel.innerHTML = `
        <div class="pm-account-heading">☁️ Preach Mate Account</div>
        <div class="pm-account-status">
          Connecting to Firebase...
        </div>
      `;
      return;
    }

    if (!currentUser) {
      panel.innerHTML = `
        <div class="pm-account-heading">☁️ Preach Mate Account</div>

        <div class="pm-account-status">
          Sign in to your account to prepare for cloud features.
        </div>

        <button class="pm-account-btn primary"
                id="pmLoginButton">
          Login
        </button>

        <button class="pm-account-btn"
                id="pmRegisterButton">
          Create Account
        </button>
      `;

      document.getElementById("pmLoginButton")
        .addEventListener("click", () => openAuthDialog("login"));

      document.getElementById("pmRegisterButton")
        .addEventListener("click", () => openAuthDialog("register"));

      return;
    }

    panel.innerHTML = `
      <div class="pm-account-heading">☁️ Preach Mate Account</div>

      <div class="pm-account-status">
        Signed in successfully.
      </div>

      <div class="pm-account-email">
        ${escapeHTML(currentUser.email || "Signed-in user")}
      </div>

      <button class="pm-account-btn"
              id="pmResetPasswordButton">
        Reset Password
      </button>

      <button class="pm-account-btn danger"
              id="pmLogoutButton">
        Logout
      </button>
    `;

    document.getElementById("pmResetPasswordButton")
      .addEventListener("click", sendPasswordReset);

    document.getElementById("pmLogoutButton")
      .addEventListener("click", logout);
  }

  function openAuthDialog(mode) {
    if (!auth) {
      showMessage("Hindi pa handa ang Firebase. Subukan muli.");
      return;
    }

    closeAuthDialog();

    const isRegister = mode === "register";

    const backdrop = document.createElement("div");
    backdrop.id = "pmAuthBackdrop";
    backdrop.className = "pm-auth-backdrop";

    backdrop.innerHTML = `
      <form class="pm-auth-dialog" id="pmAuthForm">
        <h2>${isRegister ? "Create Account" : "Welcome Back"}</h2>

        <div class="pm-auth-description">
          ${
            isRegister
              ? "Create your Preach Mate account using your email address."
              : "Log in to your Preach Mate account."
          }
        </div>

        <label for="pmAuthEmail">Email Address</label>
        <input
          id="pmAuthEmail"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          required
        >

        <label for="pmAuthPassword">Password</label>
        <input
          id="pmAuthPassword"
          type="password"
          autocomplete="${isRegister ? "new-password" : "current-password"}"
          placeholder="${isRegister ? "At least 6 characters" : "Your password"}"
          minlength="${isRegister ? "6" : "1"}"
          required
        >

        ${
          isRegister
            ? `
              <label for="pmAuthConfirm">Confirm Password</label>
              <input
                id="pmAuthConfirm"
                type="password"
                autocomplete="new-password"
                placeholder="Re-enter your password"
                minlength="6"
                required
              >
            `
            : `
              <button type="button"
                      class="pm-auth-forgot"
                      id="pmForgotPassword">
                Forgot password?
              </button>
            `
        }

        <div class="pm-auth-error" id="pmAuthError"></div>

        <div class="pm-auth-actions">
          <button type="button" id="pmAuthCancel">
            Cancel
          </button>

          <button type="submit"
                  class="primary"
                  id="pmAuthSubmit">
            ${isRegister ? "Register" : "Login"}
          </button>
        </div>
      </form>
    `;

    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) closeAuthDialog();
    });

    document.getElementById("pmAuthCancel")
      .addEventListener("click", closeAuthDialog);

    if (!isRegister) {
      document.getElementById("pmForgotPassword")
        .addEventListener("click", sendPasswordReset);
    }

    document.getElementById("pmAuthForm")
      .addEventListener("submit", async event => {
        event.preventDefault();

        const email = document
          .getElementById("pmAuthEmail")
          .value.trim();

        const password = document
          .getElementById("pmAuthPassword")
          .value;

        const errorBox = document.getElementById("pmAuthError");
        const submitButton = document.getElementById("pmAuthSubmit");

        errorBox.style.display = "none";

        if (isRegister) {
          const confirm = document
            .getElementById("pmAuthConfirm")
            .value;

          if (password !== confirm) {
            showAuthError("Hindi magkapareho ang mga password.");
            return;
          }

          if (password.length < 6) {
            showAuthError("Dapat hindi bababa sa 6 characters ang password.");
            return;
          }
        }

        submitButton.disabled = true;
        submitButton.textContent = "Please wait...";

        try {
          if (isRegister) {
            await auth.createUserWithEmailAndPassword(
              email,
              password
            );
          } else {
            await auth.signInWithEmailAndPassword(
              email,
              password
            );
          }

          closeAuthDialog();
          showMessage(
            isRegister
              ? "Account created successfully!"
              : "Login successful!"
          );

        } catch (error) {
          showAuthError(getFriendlyError(error));

        } finally {
          const button = document.getElementById("pmAuthSubmit");

          if (button) {
            button.disabled = false;
            button.textContent = isRegister ? "Register" : "Login";
          }
        }
      });

    document.getElementById("pmAuthEmail").focus();
  }

  function showAuthError(message) {
    const box = document.getElementById("pmAuthError");

    if (!box) return;

    box.textContent = message;
    box.style.display = "block";
  }

  function closeAuthDialog() {
    document.getElementById("pmAuthBackdrop")?.remove();
  }

  async function sendPasswordReset() {
    if (!auth) return;

    const emailInput = document.getElementById("pmAuthEmail");
    const email = emailInput ? emailInput.value.trim() : "";

    if (!email) {
      showAuthError("Ilagay muna ang email address mo.");
      emailInput?.focus();
      return;
    }

    try {
      await auth.sendPasswordResetEmail(email);

      showMessage("Kung rehistrado ang email, may reset instructions na ipapadala.");

    } catch (error) {
      const box = document.getElementById("pmAuthError");

      if (box) {
        box.textContent = getFriendlyError(error);
        box.style.display = "block";
      } else {
        showMessage(getFriendlyError(error));
      }
    }
  }

  async function logout() {
    if (!auth) return;

    const confirmed = window.confirm(
      "Mag-logout sa Preach Mate account?"
    );

    if (!confirmed) return;

    try {
      await auth.signOut();
      showMessage("Logged out successfully.");

    } catch (error) {
      showMessage(getFriendlyError(error));
    }
  }

  function getFriendlyError(error) {
    const code = error && error.code ? error.code : "";

    const messages = {
      "auth/email-already-in-use":
        "May account nang gumagamit ng email na ito.",

      "auth/invalid-email":
        "Hindi valid ang email address.",

      "auth/weak-password":
        "Mahina ang password. Gumamit ng hindi bababa sa 6 characters.",

      "auth/user-not-found":
        "Walang account na nakarehistro sa email na ito.",

      "auth/wrong-password":
        "Mali ang email o password.",

      "auth/invalid-credential":
        "Mali ang email o password.",

      "auth/too-many-requests":
        "Masyadong maraming pagtatangka. Subukan muli mamaya.",

      "auth/network-request-failed":
        "Walang koneksyon. Tingnan ang internet mo.",

      "auth/operation-not-allowed":
        "Hindi pa enabled ang Email/Password sign-in sa Firebase.",

      "auth/weak-password":
        "Gumamit ng password na may hindi bababa sa 6 characters."
    };

    return messages[code] ||
      "Hindi natuloy ang request. " +
      (error && error.message ? error.message : "Subukan muli.");
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function showMessage(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }

    let toast = document.getElementById("pmAuthToast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "pmAuthToast";
      toast.style.cssText = `
        position:fixed;
        left:50%;
        bottom:calc(25px + env(safe-area-inset-bottom));
        transform:translateX(-50%);
        z-index:11000;
        max-width:90vw;
        padding:11px 16px;
        border-radius:22px;
        background:#111827;
        color:white;
        font:14px Arial,sans-serif;
        text-align:center;
        box-shadow:0 4px 15px #0003;
      `;

      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  function start() {
    injectStyles();
    createAccountPanel();
    initFirebase();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  // Read-only access for the next integration phase.
  window.Pre achMateFirebase = undefined;
})();

/* ==========================================
   PREACH MATE
   FIREBASE AUTHENTICATION
   Email / Password / Email Verification
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

  let auth = null;
  let currentUser = null;
  let firebaseReady = false;

  const $ = id => document.getElementById(id);

  /* ==========================================
     INITIALIZATION
     ========================================== */

  function initFirebase() {
    if (!window.firebase) {
      console.error("Preach Mate: Firebase SDK failed to load.");

      showToast(
        "Hindi nag-load ang Firebase. Tingnan ang internet connection."
      );

      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      auth = firebase.auth();
      firebaseReady = true;

      auth.onAuthStateChanged(user => {
        currentUser = user || null;
        renderAccountPanel();
      });

      renderAccountPanel();

    } catch (error) {
      console.error("Firebase initialization error:", error);

      showToast("Hindi makakonekta sa Firebase.");
    }
  }

  /* ==========================================
     STYLES
     ========================================== */

  function injectStyles() {
    if ($("pmAuthStyles")) return;

    const style = document.createElement("style");
    style.id = "pmAuthStyles";

    style.textContent = `
      .pm-account-panel {
        margin: 10px 0;
        padding: 14px;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        background: #f9fafb;
        flex-shrink: 0;
      }

      .pm-account-heading {
        font-size: 15px;
        font-weight: 800;
        color: #111827;
        margin-bottom: 8px;
      }

      .pm-account-status {
        font-size: 12px;
        line-height: 1.6;
        color: #4b5563;
        overflow-wrap: anywhere;
        margin-bottom: 10px;
      }

      .pm-account-status.verified {
        color: #166534;
      }

      .pm-account-status.unverified {
        color: #92400e;
      }

      .pm-account-email {
        font-size: 12px;
        color: #374151;
        overflow-wrap: anywhere;
        line-height: 1.5;
        margin-bottom: 10px;
      }

      .pm-account-btn {
        display: block;
        width: 100%;
        min-height: 42px;
        padding: 10px 12px;
        margin-top: 7px;
        border: 1px solid #d1d5db;
        border-radius: 9px;
        background: #fff;
        color: #111827;
        font-size: 14px;
        font-weight: 700;
        text-align: center;
      }

      .pm-account-btn.primary {
        background: #2563eb;
        border-color: #2563eb;
        color: #fff;
      }

      .pm-account-btn.danger {
        color: #dc2626;
      }

      .pm-account-btn:disabled {
        opacity: .6;
        cursor: wait;
      }

      .pm-auth-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(0,0,0,.58);
      }

      .pm-auth-dialog {
        width: 100%;
        max-width: 390px;
        max-height: 90dvh;
        overflow-y: auto;
        padding: 22px;
        border-radius: 17px;
        background: #fff;
        color: #111827;
        box-shadow: 0 15px 45px rgba(0,0,0,.25);
      }

      .pm-auth-dialog h2 {
        font-size: 22px;
        margin: 0 0 8px;
      }

      .pm-auth-description {
        color: #6b7280;
        font-size: 13px;
        line-height: 1.55;
        margin-bottom: 18px;
      }

      .pm-auth-dialog label {
        display: block;
        font-size: 13px;
        font-weight: 700;
        margin: 13px 0 6px;
      }

      .pm-auth-dialog input {
        display: block;
        width: 100%;
        min-width: 0;
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 9px;
        outline: none;
        background: #fff;
        color: #111827;
        font-size: 16px;
      }

      .pm-auth-dialog input:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 2px #2563eb22;
      }

      .pm-auth-password-wrap {
        position: relative;
      }

      .pm-auth-password-wrap input {
        padding-right: 78px;
      }

      .pm-auth-show-password {
        position: absolute;
        top: 50%;
        right: 8px;
        transform: translateY(-50%);
        border: 0;
        background: transparent;
        color: #2563eb;
        font-size: 12px;
        font-weight: 700;
        padding: 8px 4px;
      }

      .pm-auth-error {
        display: none;
        margin-top: 13px;
        padding: 11px;
        border-radius: 8px;
        background: #fee2e2;
        color: #991b1b;
        font-size: 13px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .pm-auth-info {
        display: none;
        margin-top: 13px;
        padding: 11px;
        border-radius: 8px;
        background: #dcfce7;
        color: #166534;
        font-size: 13px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .pm-auth-actions {
        display: flex;
        gap: 9px;
        margin-top: 20px;
      }

      .pm-auth-actions button {
        flex: 1;
        min-height: 44px;
        padding: 10px;
        border: 1px solid #d1d5db;
        border-radius: 9px;
        background: #fff;
        color: #111827;
        font-size: 14px;
        font-weight: 700;
      }

      .pm-auth-actions button.primary {
        background: #2563eb;
        border-color: #2563eb;
        color: #fff;
      }

      .pm-auth-actions button:disabled {
        opacity: .6;
        cursor: wait;
      }

      .pm-auth-link {
        display: block;
        margin-top: 13px;
        padding: 7px 0;
        border: 0;
        background: transparent;
        color: #2563eb;
        font-size: 13px;
        text-align: left;
      }

      .pm-auth-toast {
        position: fixed;
        left: 50%;
        bottom: calc(80px + env(safe-area-inset-bottom));
        transform: translateX(-50%);
        z-index: 11000;
        max-width: 90vw;
        padding: 11px 16px;
        border-radius: 22px;
        background: #111827;
        color: #fff;
        font-size: 13px;
        line-height: 1.5;
        text-align: center;
        box-shadow: 0 4px 15px #0003;
      }
    `;

    document.head.appendChild(style);
  }

  /* ==========================================
     ACCOUNT PANEL
     ========================================== */

  function ensureAccountPanel() {
    let panel = $("pmAccountPanel");

    if (panel) return panel;

    const drawer = document.querySelector(".drawer");

    if (!drawer) {
      return null;
    }

    panel = document.createElement("section");
    panel.id = "pmAccountPanel";
    panel.className = "pm-account-panel";

    const anchor =
      drawer.querySelector(".drawer-brand-row") ||
      drawer.querySelector(".drawer-title");

    if (anchor) {
      anchor.insertAdjacentElement("afterend", panel);
    } else {
      drawer.prepend(panel);
    }

    return panel;
  }

  function renderAccountPanel() {
    const panel = ensureAccountPanel();

    if (!panel) return;

    panel.replaceChildren();

    const heading = document.createElement("div");
    heading.className = "pm-account-heading";
    heading.textContent = "☁️ Preach Mate Account";

    panel.appendChild(heading);

    if (!firebaseReady || !auth) {
      addText(
        panel,
        "Connecting to Firebase...",
        "pm-account-status"
      );
      return;
    }

    if (!currentUser) {
      addText(
        panel,
        "Create an account or log in to prepare for cloud synchronization.",
        "pm-account-status"
      );

      addButton(
        panel,
        "Login",
        () => openAuthDialog("login"),
        true
      );

      addButton(
        panel,
        "Create Account",
        () => openAuthDialog("register")
      );

      return;
    }

    const email = document.createElement("div");
    email.className = "pm-account-email";
    email.textContent = currentUser.email || "Account";

    panel.appendChild(email);

    if (currentUser.emailVerified) {
      addText(
        panel,
        "✓ Email verified successfully.",
        "pm-account-status verified"
      );
    } else {
      addText(
        panel,
        "⚠ Email not verified yet. Open the verification link sent to your email.",
        "pm-account-status unverified"
      );

      addButton(
        panel,
        "Resend Verification Email",
        resendVerification
      );

      addButton(
        panel,
        "I've Verified My Email",
        refreshVerification
      );
    }

    addButton(
      panel,
      "Reset Password",
      sendPasswordReset
    );

    addButton(
      panel,
      "Logout",
      logout,
      false,
      true
    );
  }

  function addText(parent, value, className) {
    const div = document.createElement("div");

    div.className = className || "pm-account-status";
    div.textContent = value;

    parent.appendChild(div);

    return div;
  }

  function addButton(
    parent,
    label,
    action,
    primary = false,
    danger = false
  ) {
    const button = document.createElement("button");

    button.type = "button";
    button.className =
      "pm-account-btn" +
      (primary ? " primary" : "") +
      (danger ? " danger" : "");

    button.textContent = label;

    button.addEventListener("click", action);

    parent.appendChild(button);

    return button;
  }

  /* ==========================================
     AUTHENTICATION FORM
     ========================================== */

  function openAuthDialog(mode) {
    if (!auth) {
      showToast("Hindi pa handa ang Firebase.");
      return;
    }

    closeAuthDialog();

    const isRegister = mode === "register";
    const backdrop = document.createElement("div");

    backdrop.id = "pmAuthBackdrop";
    backdrop.className = "pm-auth-backdrop";

    backdrop.innerHTML = `
      <form class="pm-auth-dialog" id="pmAuthForm">

        <h2>
          ${isRegister ? "Create Account" : "Welcome Back"}
        </h2>

        <div class="pm-auth-description">
          ${
            isRegister
              ? "Create your Preach Mate account. You must verify your email address after registration."
              : "Log in using your registered email address and password."
          }
        </div>

        <label for="pmAuthEmail">Email Address</label>

        <input
          id="pmAuthEmail"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          maxlength="254"
          required
        >

        <label for="pmAuthPassword">Password</label>

        <div class="pm-auth-password-wrap">
          <input
            id="pmAuthPassword"
            type="password"
            autocomplete="${isRegister ? "new-password" : "current-password"}"
            placeholder="${isRegister ? "At least 6 characters" : "Your password"}"
            minlength="${isRegister ? "6" : "1"}"
            required
          >

          <button
            type="button"
            class="pm-auth-show-password"
            id="pmAuthShowPassword"
          >Show</button>
        </div>

        ${
          isRegister
            ? `
              <label for="pmAuthConfirm">
                Confirm Password
              </label>

              <div class="pm-auth-password-wrap">
                <input
                  id="pmAuthConfirm"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Re-enter password"
                  minlength="6"
                  required
                >

                <button
                  type="button"
                  class="pm-auth-show-password"
                  id="pmAuthShowConfirm"
                >Show</button>
              </div>
            `
            : `
              <button
                type="button"
                class="pm-auth-link"
                id="pmAuthForgot"
              >Forgot password?</button>
            `
        }

        <div class="pm-auth-error" id="pmAuthError"></div>

        <div class="pm-auth-info" id="pmAuthInfo"></div>

        <div class="pm-auth-actions">

          <button type="button" id="pmAuthCancel">
            Cancel
          </button>

          <button
            type="submit"
            class="primary"
            id="pmAuthSubmit"
          >
            ${isRegister ? "Create Account" : "Login"}
          </button>

        </div>

      </form>
    `;

    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) {
        closeAuthDialog();
      }
    });

    $("pmAuthCancel").addEventListener(
      "click",
      closeAuthDialog
    );

    $("pmAuthShowPassword").addEventListener(
      "click",
      () => togglePassword(
        "pmAuthPassword",
        "pmAuthShowPassword"
      )
    );

    if (isRegister) {
      $("pmAuthShowConfirm").addEventListener(
        "click",
        () => togglePassword(
          "pmAuthConfirm",
          "pmAuthShowConfirm"
        )
      );
    } else {
      $("pmAuthForgot").addEventListener(
        "click",
        sendPasswordReset
      );
    }

    $("pmAuthForm").addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        clearAuthMessages();

        const email = $("pmAuthEmail").value.trim();
        const password = $("pmAuthPassword").value;

        if (!email) {
          showAuthError("Ilagay ang email address.");
          return;
        }

        if (isRegister) {
          const confirm = $("pmAuthConfirm").value;

          if (password.length < 6) {
            showAuthError(
              "Dapat hindi bababa sa 6 characters ang password."
            );
            return;
          }

          if (password !== confirm) {
            showAuthError(
              "Hindi magkapareho ang password at confirmation."
            );
            return;
          }
        }

        const submit = $("pmAuthSubmit");

        submit.disabled = true;
        submit.textContent = "Please wait...";

        try {
          if (isRegister) {
            await registerAccount(email, password);
          } else {
            await loginAccount(email, password);
          }

        } catch (error) {
          console.error("Preach Mate authentication:", error);

          showAuthError(getFriendlyError(error));

        } finally {
          const button = $("pmAuthSubmit");

          if (button) {
            button.disabled = false;
            button.textContent =
              isRegister ? "Create Account" : "Login";
          }
        }
      }
    );

    $("pmAuthEmail").focus();
  }

  function togglePassword(inputId, buttonId) {
    const input = $(inputId);
    const button = $(buttonId);

    if (!input || !button) return;

    const showing = input.type === "text";

    input.type = showing ? "password" : "text";
    button.textContent = showing ? "Show" : "Hide";
  }

  /* ==========================================
     REGISTER + EMAIL VERIFICATION
     ========================================== */

  async function registerAccount(email, password) {
    const result = await auth.createUserWithEmailAndPassword(
      email,
      password
    );

    try {
      await result.user.sendEmailVerification();

      showAuthInfo(
        "Account created! A verification link has been sent to " +
        email +
        ". Open your email and click the link before proceeding."
      );

      showToast("Verification email sent!");

      /*
       * Keep the form open so the user can read the message.
       * Firebase has already created the account.
       */

      renderAccountPanel();

    } catch (error) {
      console.error("Verification email error:", error);

      showAuthError(
        "Account created, but the verification email could not be sent. " +
        "Use Resend Verification Email after closing this form. " +
        getFriendlyError(error)
      );

      renderAccountPanel();
      return;
    }

    /*
     * The account is created, but the email is not yet verified.
     * The user can close the dialog and resend the verification email
     * from the account panel.
     */
  }

  /* ==========================================
     LOGIN
     ========================================== */

  async function loginAccount(email, password) {
    const result = await auth.signInWithEmailAndPassword(
      email,
      password
    );

    await result.user.reload();

    currentUser = auth.currentUser;

    renderAccountPanel();

    if (currentUser && currentUser.emailVerified) {
      closeAuthDialog();
      showToast("Login successful. Email verified.");
      return;
    }

    showAuthInfo(
      "Login successful, but your email is not verified yet. " +
      "Open the verification link sent to your email. " +
      "You can resend the link from the account panel."
    );

    showToast("Please verify your email.");
  }

  /* ==========================================
     RESEND VERIFICATION EMAIL
     ========================================== */

  async function resendVerification() {
    if (!auth || !auth.currentUser) {
      showToast("Mag-login muna sa account mo.");
      return;
    }

    try {
      await auth.currentUser.reload();

      currentUser = auth.currentUser;

      if (currentUser.emailVerified) {
        renderAccountPanel();
        showToast("Verified na ang email mo!");
        return;
      }

      await currentUser.sendEmailVerification();

      showToast("Bagong verification email ang ipinadala.");

      renderAccountPanel();

    } catch (error) {
      console.error("Resend verification error:", error);

      showToast(getFriendlyError(error));
    }
  }

  /* ==========================================
     REFRESH VERIFICATION STATUS
     ========================================== */

  async function refreshVerification() {
    if (!auth || !auth.currentUser) {
      showToast("Mag-login muna sa account mo.");
      return;
    }

    try {
      await auth.currentUser.reload();

      currentUser = auth.currentUser;

      renderAccountPanel();

      if (currentUser.emailVerified) {
        showToast("✓ Email verified successfully!");
      } else {
        showToast(
          "Hindi pa verified. Buksan ang verification link sa email mo."
        );
      }

    } catch (error) {
      console.error("Verification check error:", error);

      showToast(getFriendlyError(error));
    }
  }

  /* ==========================================
     FORGOT / RESET PASSWORD
     ========================================== */

  async function sendPasswordReset() {
    if (!auth) return;

    const emailInput = $("pmAuthEmail");

    const email = emailInput
      ? emailInput.value.trim()
      : currentUser && currentUser.email
        ? currentUser.email
        : "";

    if (!email) {
      showAuthError(
        "Ilagay muna ang email address para makapagpadala ng reset link."
      );

      if (emailInput) emailInput.focus();

      return;
    }

    try {
      await auth.sendPasswordResetEmail(email);

      showAuthInfo(
        "Kung rehistrado ang email address na ito, makakatanggap ka ng password reset instructions."
      );

      showToast("Password reset request submitted.");

    } catch (error) {
      console.error("Password reset error:", error);

      showAuthError(getFriendlyError(error));
    }
  }

  /* ==========================================
     LOGOUT
     ========================================== */

  async function logout() {
    if (!auth) return;

    if (!window.confirm("Mag-logout sa Preach Mate account?")) {
      return;
    }

    try {
      await auth.signOut();

      currentUser = null;

      renderAccountPanel();

      showToast("Logged out successfully.");

    } catch (error) {
      console.error("Logout error:", error);

      showToast(getFriendlyError(error));
    }
  }

  /* ==========================================
     FORM MESSAGES
     ========================================== */

  function clearAuthMessages() {
    const error = $("pmAuthError");
    const info = $("pmAuthInfo");

    if (error) {
      error.textContent = "";
      error.style.display = "none";
    }

    if (info) {
      info.textContent = "";
      info.style.display = "none";
    }
  }

  function showAuthError(message) {
    const box = $("pmAuthError");

    if (!box) {
      showToast(message);
      return;
    }

    box.textContent = message;
    box.style.display = "block";

    const info = $("pmAuthInfo");

    if (info) info.style.display = "none";
  }

  function showAuthInfo(message) {
    const box = $("pmAuthInfo");

    if (!box) {
      showToast(message);
      return;
    }

    box.textContent = message;
    box.style.display = "block";

    const error = $("pmAuthError");

    if (error) error.style.display = "none";
  }

  function closeAuthDialog() {
    $("pmAuthBackdrop")?.remove();
  }

  /* ==========================================
     FRIENDLY ERRORS
     ========================================== */

  function getFriendlyError(error) {
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
        "Hindi tama ang email o password.",

      "auth/too-many-requests":
        "Masyadong maraming pagtatangka. Subukan muli mamaya.",

      "auth/network-request-failed":
        "Walang koneksyon. Tingnan ang internet connection.",

      "auth/operation-not-allowed":
        "Hindi enabled ang Email/Password sa Firebase Authentication.",

      "auth/invalid-action-code":
        "Invalid o expired ang verification link. Humingi ng bagong link.",

      "auth/expired-action-code":
        "Expired na ang verification link. Magpadala ng bagong link.",

      "auth/requires-recent-login":
        "Mag-login muli bago gawin ang request na ito.",

      "auth/quota-exceeded":
        "Naabot ang email sending limit. Subukan muli mamaya.",

      "auth/too-many-requests":
        "Masyadong maraming request. Maghintay muna bago subukan muli."
    };

    return messages[error && error.code] ||
      (
        error && error.message
          ? error.message
          : "May naganap na error. Subukan muli."
      );
  }

  /* ==========================================
     TOAST
     ========================================== */

  function showToast(message) {
    let toast = $("pmAuthToast");

    if (!toast) {
      toast = document.createElement("div");

      toast.id = "pmAuthToast";
      toast.className = "pm-auth-toast";

      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
      toast.style.display = "none";
    }, 3500);
  }

  /* ==========================================
     START
     ========================================== */

  function start() {
    injectStyles();

    initFirebase();

    /*
     * Retry briefly in case the existing app creates
     * its drawer after this script starts.
     */

    let attempts = 0;

    const timer = setInterval(() => {
      attempts++;

      if (
        document.querySelector(".drawer") &&
        !$("pmAccountPanel")
      ) {
        renderAccountPanel();
      }

      if ($("pmAccountPanel") || attempts >= 20) {
        clearInterval(timer);
      }
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, {
      once: true
    });
  } else {
    start();
  }

  /*
   * Public interface for the future Firestore integration.
   */

  window.PreachMateFirebase = {
    get auth() {
      return auth;
    },

    get currentUser() {
      return currentUser;
    },

    get isReady() {
      return firebaseReady;
    },

    resendVerification,
    refreshVerification
  };

})();

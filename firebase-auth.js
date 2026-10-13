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

  function message(text) {
    alert(text);
  }

  function init() {
    if (!window.firebase) {
      console.error("Firebase SDK did not load.");
      message("Firebase SDK hindi nag-load. Tingnan ang internet connection.");
      return;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      auth = firebase.auth();

      auth.onAuthStateChanged(user => {
        currentUser = user;
        renderAccount();
      });

      renderAccount();

    } catch (error) {
      console.error("Firebase initialization error:", error);
      message("Firebase error: " + error.message);
    }
  }

  function renderAccount() {
    let panel = document.getElementById("pmAccountPanel");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "pmAccountPanel";

      panel.style.cssText = [
        "margin:12px 0",
        "padding:14px",
        "border:1px solid #e5e7eb",
        "border-radius:12px",
        "background:#f9fafb"
      ].join(";");

      const drawer = document.querySelector(".drawer");

      if (drawer) {
        const title = drawer.querySelector(".drawer-title");

        if (title) {
          title.insertAdjacentElement("afterend", panel);
        } else {
          drawer.prepend(panel);
        }
      } else {
        console.error("Preach Mate drawer not found.");
        return;
      }
    }

    panel.replaceChildren();

    const heading = document.createElement("div");
    heading.textContent = "☁️ Preach Mate Account";
    heading.style.cssText =
      "font-weight:bold;font-size:15px;margin-bottom:10px";

    panel.appendChild(heading);

    if (!auth) {
      addText(panel, "Connecting to Firebase...");
      return;
    }

    if (currentUser) {
      addText(panel, "Signed in as:");
      addText(panel, currentUser.email || "Account");

      addButton(panel, "Logout", async () => {
        if (!confirm("Mag-logout sa account?")) return;

        try {
          await auth.signOut();
          message("Logout successful.");
        } catch (error) {
          message(error.message);
        }
      });

      return;
    }

    addText(panel, "Sign in to your Preach Mate account.");

    addButton(panel, "Login", () => showAuthForm(false), true);
    addButton(panel, "Create Account", () => showAuthForm(true));
  }

  function addText(parent, text) {
    const div = document.createElement("div");
    div.textContent = text;
    div.style.cssText =
      "font-size:13px;line-height:1.6;margin-bottom:8px;overflow-wrap:anywhere";
    parent.appendChild(div);
  }

  function addButton(parent, label, action, primary = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;

    button.style.cssText = [
      "display:block",
      "width:100%",
      "padding:12px",
      "margin-top:8px",
      "border-radius:9px",
      "border:1px solid " + (primary ? "#2563eb" : "#d1d5db"),
      "background:" + (primary ? "#2563eb" : "#fff"),
      "color:" + (primary ? "#fff" : "#111827"),
      "font-size:15px",
      "font-weight:bold"
    ].join(";");

    button.addEventListener("click", action);
    parent.appendChild(button);
  }

  function showAuthForm(register) {
    const email = prompt("Ilagay ang email address:");

    if (email === null || !email.trim()) return;

    const password = prompt("Ilagay ang password:");

    if (password === null || !password) return;

    if (register && password.length < 6) {
      message("Dapat hindi bababa sa 6 characters ang password.");
      return;
    }

    const request = register
      ? auth.createUserWithEmailAndPassword(
          email.trim(),
          password
        )
      : auth.signInWithEmailAndPassword(
          email.trim(),
          password
        );

    request
      .then(() => {
        message(
          register
            ? "Matagumpay na nagawa ang account!"
            : "Matagumpay ang login!"
        );
      })
      .catch(error => {
        console.error("Authentication error:", error);

        const errors = {
          "auth/email-already-in-use":
            "May account nang gumagamit ng email na ito.",
          "auth/invalid-email":
            "Hindi valid ang email address.",
          "auth/weak-password":
            "Masyadong mahina ang password.",
          "auth/invalid-credential":
            "Mali ang email o password.",
          "auth/user-not-found":
            "Walang account na gumagamit ng email na ito.",
          "auth/wrong-password":
            "Mali ang password.",
          "auth/operation-not-allowed":
            "I-enable ang Email/Password sa Firebase Authentication."
        };

        message(errors[error.code] || error.message);
      });
  }

  function start() {
    init();

    // Retry in case the existing app creates its drawer later.
    let attempts = 0;

    const timer = setInterval(() => {
      attempts++;

      if (
        document.querySelector(".drawer") &&
        !document.getElementById("pmAccountPanel")
      ) {
        renderAccount();
      }

      if (
        document.getElementById("pmAccountPanel") ||
        attempts >= 20
      ) {
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

  window.PreachMateFirebase = {
    get auth() {
      return auth;
    },
    get currentUser() {
      return currentUser;
    }
  };
})();

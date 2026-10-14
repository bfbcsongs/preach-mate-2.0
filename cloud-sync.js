(() => {
  "use strict";

  const NOTES_KEY = "notepal_notes_v2";
  const CATEGORIES_KEY = "notepal_categories_v2";
  const LOGO_KEY = "preach_mate_logo_v1";

  const SYNC_INTERVAL = 2500;
  const RESTORE_RELOAD_KEY = "preachmate_cloud_restore_reload_v1";

  let db = null;
  let currentUid = null;
  let cloudReady = false;
  let syncing = false;
  let timer = null;
  let lastSnapshot = "";
  let lastErrorMessage = "";
  let suppressNextReload = false;

  function readLocal(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function readLogo() {
    try {
      return localStorage.getItem(LOGO_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function writeLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Preach Mate local storage error:", error);
      return false;
    }
  }

  function makeSnapshot() {
    return JSON.stringify({
      notes: readLocal(NOTES_KEY, []),
      categories: readLocal(CATEGORIES_KEY, [
        "All Notes",
        "Personal",
        "Study",
        "Work",
        "Ideas"
      ]),
      logo: readLogo()
    });
  }

  function getUser() {
    const api = window.PreachMateFirebase;

    if (!api || typeof api.getCurrentUser !== "function") {
      return null;
    }

    return api.getCurrentUser();
  }

  function getDatabase() {
    const api = window.PreachMateFirebase;

    if (!api || typeof api.getFirestore !== "function") {
      return null;
    }

    return api.getFirestore();
  }

  function showSyncError(error) {
    console.error("Preach Mate cloud sync error:", error);

    const message =
      error && error.message
        ? error.message
        : "Unknown cloud sync error";

    if (message !== lastErrorMessage) {
      lastErrorMessage = message;
      console.warn(
        "Cloud sync needs attention. Check Firebase configuration, " +
        "authentication, Firestore rules, and network connection."
      );
    }
  }

  function normalizeCategories(input, notes) {
    const result = ["All Notes"];

    if (Array.isArray(input)) {
      input.forEach(category => {
        if (
          typeof category === "string" &&
          category.trim() &&
          category.trim() !== "All Notes" &&
          !result.includes(category.trim())
        ) {
          result.push(category.trim());
        }
      });
    }

    if (!result.some(category => category !== "All Notes")) {
      result.push("Personal");
    }

    if (Array.isArray(notes)) {
      notes.forEach(note => {
        if (!note || typeof note !== "object") return;

        const category =
          typeof note.category === "string"
            ? note.category.trim()
            : "";

        if (
          category &&
          category !== "All Notes" &&
          !result.includes(category)
        ) {
          result.push(category);
        }
      });
    }

    return result;
  }

  function normalizeNotes(input, categories) {
    if (!Array.isArray(input)) return [];

    return input
      .filter(note => note && typeof note === "object")
      .map(note => {
        const result = { ...note };

        if (typeof result.id !== "string" || !result.id) {
          result.id =
            "n_" +
            Date.now().toString(36) +
            "_" +
            Math.random().toString(36).slice(2, 8);
        }

        if (typeof result.title !== "string") {
          result.title = "";
        }

        if (typeof result.content !== "string") {
          result.content = "";
        }

        if (typeof result.favorite !== "boolean") {
          result.favorite = false;
        }

        if (typeof result.pinned !== "boolean") {
          result.pinned = false;
        }

        if (
          typeof result.category !== "string" ||
          !categories.includes(result.category)
        ) {
          result.category =
            categories.find(category => category !== "All Notes") ||
            "Personal";
        }

        if (!Number.isFinite(Number(result.updated))) {
          result.updated = Date.now();
        }

        return result;
      });
  }

  function notesCollection(uid) {
    return db.collection("users")
      .doc(uid)
      .collection("notes");
  }

  function settingsDocument(uid) {
    return db.collection("users")
      .doc(uid)
      .collection("settings")
      .doc("app");
  }

  async function readCloud(uid) {
    const [notesSnapshot, settingsSnapshot] = await Promise.all([
      notesCollection(uid).get(),
      settingsDocument(uid).get()
    ]);

    const cloudNotes = [];

    notesSnapshot.forEach(document => {
      const data = document.data() || {};

      cloudNotes.push({
        ...data,
        id: typeof data.id === "string" && data.id
          ? data.id
          : document.id
      });
    });

    const settings = settingsSnapshot.exists
      ? settingsSnapshot.data() || {}
      : {};

    return {
      notes: cloudNotes,
      settings,
      settingsExists: settingsSnapshot.exists,
      hasCloudData:
        settings.initialized === true ||
        notesSnapshot.size > 0
    };
  }

  async function restoreCloud(uid, cloud) {
    const settings = cloud.settings || {};

    const cloudCategories = Array.isArray(settings.categories)
      ? settings.categories
      : null;

    const categories = normalizeCategories(
      cloudCategories || [],
      cloud.notes
    );

    const notes = normalizeNotes(cloud.notes, categories);

    const oldSnapshot = makeSnapshot();

    /*
     * Replace local data with the established cloud backup.
     * Do not upload defaults over an existing cloud backup.
     */
    if (!writeLocal(NOTES_KEY, notes)) {
      throw new Error("Could not restore cloud notes to local storage.");
    }

    if (!writeLocal(CATEGORIES_KEY, categories)) {
      throw new Error("Could not restore cloud categories to local storage.");
    }

    if (
      typeof settings.logo === "string" &&
      settings.logo.startsWith("data:image/")
    ) {
      try {
        localStorage.setItem(LOGO_KEY, settings.logo);
      } catch (error) {
        throw new Error("Could not restore the church logo locally.");
      }
    } else if (settings.logo === "") {
      try {
        localStorage.removeItem(LOGO_KEY);
      } catch (error) {}
    }

    const newSnapshot = makeSnapshot();

    lastSnapshot = newSnapshot;
    cloudReady = true;
    lastErrorMessage = "";

    /*
     * app.js keeps its own in-memory notes and categories.
     * Reload only when cloud data differs, so the app loads the
     * restored data into memory. The second startup will not reload
     * again because local storage now matches the cloud.
     */
    if (oldSnapshot !== newSnapshot) {
      try {
        sessionStorage.setItem(RESTORE_RELOAD_KEY, "1");
      } catch (error) {}

      suppressNextReload = true;

      window.location.reload();
      return;
    }

    console.log("Preach Mate: local data already matches cloud.");
  }

  async function uploadLocal(uid) {
    const snapshot = makeSnapshot();
    const data = JSON.parse(snapshot);

    const notes = normalizeNotes(
      data.notes,
      normalizeCategories(data.categories, data.notes)
    );

    const categories = normalizeCategories(
      data.categories,
      notes
    );

    const collection = notesCollection(uid);
    const settingsRef = settingsDocument(uid);

    /*
     * Read existing cloud note IDs so deleted local notes can
     * also be deleted from Firestore.
     */
    const existing = await collection.get();

    const localIds = new Set(
      notes.map(note => String(note.id))
    );

    const operations = [];

    existing.forEach(document => {
      if (!localIds.has(document.id)) {
        operations.push({
          type: "delete",
          ref: document.ref
        });
      }
    });

    notes.forEach(note => {
      const id = String(note.id);

      operations.push({
        type: "set",
        ref: collection.doc(id),
        data: {
          ...note,
          id
        }
      });
    });

    /*
     * Keep each batch below Firestore's 500-operation limit.
     */
    while (operations.length) {
      const chunk = operations.splice(0, 400);
      const batch = db.batch();

      chunk.forEach(operation => {
        if (operation.type === "delete") {
          batch.delete(operation.ref);
        } else {
          batch.set(operation.ref, operation.data);
        }
      });

      await batch.commit();
    }

    await settingsRef.set({
      categories,
      logo: data.logo || "",
      initialized: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    lastSnapshot = makeSnapshot();
    lastErrorMessage = "";

    console.log("Preach Mate: cloud backup updated.");
  }

  async function initializeCloud(uid) {
    if (!uid || syncing) return;

    syncing = true;
    cloudReady = false;
    currentUid = uid;
    db = getDatabase();

    try {
      if (!db) {
        throw new Error("Firebase Firestore is unavailable.");
      }

      /*
       * Allow app.js startup and its device-backup recovery to finish
       * before comparing local data with cloud data.
       */
      await new Promise(resolve => setTimeout(resolve, 1200));

      if (getUser()?.uid !== uid) return;

      const cloud = await readCloud(uid);

      if (cloud.hasCloudData) {
        /*
         * An established cloud backup always wins during sign-in.
         */
        await restoreCloud(uid, cloud);
        return;
      }

      /*
       * No cloud backup exists yet.
       * This is the first cloud initialization, so preserve the
       * current local notes/categories/logo as the initial backup.
       */
      await uploadLocal(uid);

      cloudReady = true;
      lastSnapshot = makeSnapshot();

      console.log("Preach Mate: first cloud backup created.");
    } catch (error) {
      cloudReady = false;
      showSyncError(error);
    } finally {
      syncing = false;
    }
  }

  async function checkForLocalChanges() {
    if (!cloudReady || syncing || !currentUid) return;

    const user = getUser();

    if (!user || user.uid !== currentUid) {
      cloudReady = false;
      return;
    }

    const snapshot = makeSnapshot();

    if (snapshot === lastSnapshot) return;

    syncing = true;

    try {
      await uploadLocal(currentUid);
      lastSnapshot = makeSnapshot();
    } catch (error) {
      showSyncError(error);
    } finally {
      syncing = false;
    }
  }

  function stopSync() {
    cloudReady = false;
    syncing = false;
    currentUid = null;
    lastSnapshot = "";

    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function handleAuthState(user) {
    if (!user) {
      stopSync();
      return;
    }

    if (currentUid === user.uid && (cloudReady || syncing)) {
      return;
    }

    if (currentUid && currentUid !== user.uid) {
      stopSync();
    }

    initializeCloud(user.uid);
  }

  /*
   * firebase-auth.js dispatches this event when authentication
   * state changes.
   */
  window.addEventListener("preachmate:auth-state-changed", event => {
    const user = event.detail && event.detail.user
      ? event.detail.user
      : null;

    handleAuthState(user);
  });

  /*
   * Also check the current user in case the auth event fired before
   * this file finished initializing.
   */
  window.addEventListener("load", () => {
    const user = getUser();

    if (user) {
      handleAuthState(user);
    }

    if (!timer) {
      timer = setInterval(checkForLocalChanges, SYNC_INTERVAL);
    }
  });

  /*
   * If local storage changes in another same-origin tab, the next
   * polling cycle will detect the changed snapshot.
   */
  window.addEventListener("storage", () => {
    if (cloudReady) {
      checkForLocalChanges();
    }
  });

})();

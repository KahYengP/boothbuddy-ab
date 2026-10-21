/* A/B study for the Apply Events page (Loop11).

   Each version is its own small site with only the apply page:
     version-a/  the earlier 3-step apply flow
     version-b/  the latest one-page apply flow
   Open the folder's address (for example .../version-a/) and the test starts.

   What this file does
   - knows which version this site is (STUDY_CONFIG in index.html)
   - gives every new participant the same clean start (forgets anything an earlier participant saved).
     A page refresh keeps their progress.
   - in Version B, Rachel's documents are already uploaded, the same as her document vault in Version A
   - starts a timer
   - keeps the participant on the apply page (other links are switched off)
   - after "Submit application", opens submitted.html with the version and time in the address,
     so the Loop11 report shows them */
var STUDY = { cfg: window.STUDY_CONFIG || null };

STUDY.get = function (k) { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } };
STUDY.version = function () { return STUDY.get("bb_study"); };

STUDY.finish = function (ev, form) {
  var v = STUDY.version();
  if (!v) { return false; }
  var t0 = parseInt(STUDY.get("bb_study_t0"), 10) || 0;
  var secs = t0 ? Math.round((Date.now() - t0) / 1000) : "";
  var sell = form && form.products && form.products.trim() ? 1 : 0;
  location.href = "submitted.html?v=" + v + "&event=" + ev.id + "&sell=" + sell + "&secs=" + secs;
  return true;
};

(function () {
  var q = new URLSearchParams(location.search), v = (q.get("v") || "").toLowerCase(), ev = q.get("event");
  if (STUDY.cfg) {
    v = v || STUDY.cfg.v; ev = ev || String(STUDY.cfg.event);
    /* the apply page reads the event from the address */
    if (!q.get("event") && /index\.html$|\/$/.test(location.pathname)) { history.replaceState(null, "", location.pathname + "?event=" + ev + "&v=" + v); }
  }
  if (v !== "a" && v !== "b") { return; }
  try {
    var fresh = STUDY.get("bb_study") !== v;  /* a new participant (new window), not a refresh */
    if (fresh) {
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf("bb_") === 0) { localStorage.removeItem(k); } });
      sessionStorage.setItem("bb_study", v);
      sessionStorage.setItem("bb_study_t0", String(Date.now()));
      /* both versions start with Rachel's documents already uploaded */
      var files = {
          acra: { name: "acra-rachel.pdf", size: 245760 }, nea: { name: "nea-rachel.pdf", size: 198656 },
          halal: { name: "halal-rachel.pdf", size: 176128 }, insurance: { name: "insurance-rachel.pdf", size: 312320 },
          menu: { name: "menu-rachel.pdf", size: 155648 }, layout: { name: "layout-rachel.pdf", size: 133120 }
        };
      var start = v === "b" ? { category: "", booth: "", qty: 1, together: true, products: "", agree: false, files: files, savedAt: "" }
        : { category: "", booth: "", qty: 1, together: true, products: "", agree: false, files: files };
      localStorage.setItem("bb_apply_" + (ev || "4"), JSON.stringify(start));
    }
  } catch (e) {}

  /* only the apply page is part of the test: other links do nothing */
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null; if (!a) { return; }
    var h = a.getAttribute("href") || "";
    if (/^submitted\.html/.test(h) || h.charAt(0) === "#") { return; }
    e.preventDefault(); e.stopPropagation();
    if (window.BB && BB.toast) { BB.toast("This test only covers applying for the booth."); }
  }, true);
})();

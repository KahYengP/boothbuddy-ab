/* Version A of the A/B test: the earlier 3-step apply flow.
   Step 1 Things to note, step 2 Upload documents, step 3 Your booth and submit. One screen at a time.
   The fields, payment card and 2D booth plan are the same as the latest version; only the flow differs. */
var AP = { ev: null, det: null, step: 1, submitted: false, form: { category: "", booth: "", qty: 1, together: true, products: "", agree: false, files: {} } };

AP.key = function () { return "bb_apply_" + AP.ev.id; };
AP.save = function () { BB.write("localStorage", AP.key(), AP.form); };
AP.type = function () { return BB.boothType(AP.form.booth); };
AP.q = function () { return BB.quote(AP.ev, AP.type() ? AP.form.booth : BB.boothTypesFor(AP.ev, AP.form.category)[0].id, AP.form.qty); };
AP.locked = function () { return false; };

AP.reqs = function () {
  var ev = AP.ev, out = [], days = BB.daysUntil(ev.closes);
  out.push({ s: days >= 0 ? "ok" : "bad", t: "Applications are open", sub: BB.closingText(ev) + " (" + BB.shortDate(ev.closes) + ")" });
  AP.det.required.forEach(function (id) { out.push({ s: AP.form.files[id] ? "ok" : "bad", t: BB_DOC_NAMES[id], sub: AP.form.files[id] ? "Uploaded" : "Not uploaded yet" }); });
  return out;
};

AP.blockers = function () { return AP.reqs().filter(function (r) { return r.s === "bad"; }).length; };
AP.warnings = function () { return AP.reqs().filter(function (r) { return r.s === "warn"; }).length; };

AP.tick = function (s) { return '<span class="tick ' + s + '">' + BB.icon(s === "ok" ? "check" : (s === "warn" ? "clock" : "x")) + "</span>"; };

AP.stepper = function () {
  var names = ["Things to note", "Documents", "Review and submit"];
  return '<div class="stepper">' + names.map(function (n, i) {
    var cls = AP.step === i + 1 ? " is-active" : (AP.step > i + 1 ? " is-done" : "");
    return '<div class="step' + cls + '"><span class="num">' + (AP.step > i + 1 ? "&#10003;" : i + 1) + "</span>" + n + "</div>";
  }).join("") + "</div>";
};

AP.step1 = function () {
  /* the same organiser rules and cancellation policy as the latest version */
  var pol = BB_POLICY.map(function (p) {
    return '<div class="pol"><span class="pol-ic">' + BB.icon(p.i, 15) + "</span><div><b>" + p.h + "</b><ul>" + p.p.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></div></div>";
  }).join("");
  return '<div class="panel glass"><div class="section-title"><span>Things to note</span><span class="chip">' + BB.icon("clock", 13) + " Read before you submit</span></div>" +
    '<p class="muted note-lead">' + BB.icon("sparkle", 14) + " Sellers are encouraged to decorate their booth.</p>" + pol +
    '<div class="nav-row"><span></span><button class="btn btn-primary" id="next">Continue to documents</button></div></div>';
};

/* organiser rules and cancellation policy (same wording as the latest version) */
var BB_POLICY = [
  { h: "Curation", i: "search", p: ["The organiser reviews applications in 3 to 5 working days.", "They look at repeated products, clashing product types and items that do not fit the event.", "If you are not approved, you get a full refund."] },
  { h: "Booth confirmation", i: "check", p: ["You get an email once your booth is approved.", "Your booking is confirmed only after approval and payment."] },
  { h: "Booth allocation", i: "map", p: ["The organiser decides the final booth location.", "Sharing a booth needs the organiser's approval. No swapping with other sellers without approval."] },
  { h: "On the day", i: "clock", p: ["If you do not turn up, you lose your booth with no refund."] },
  { h: "Cancellation and refund", i: "x", p: ["Before you are accepted, you can change or withdraw for free until applications close.", "Once your booking is confirmed, cancellation is not allowed. You can send a request, which the organiser may approve.", "No cash refund unless the organiser accepts your reason."] }
];

/* step 2: upload each document this event needs (the same upload rows as the latest version) */
AP.size = function (n) { return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; };
AP.step2 = function () {
  var req = AP.det.required, n = req.filter(function (id) { return AP.form.files[id]; }).length;
  var rows = req.map(function (id) {
    var f = AP.form.files[id];
    if (f) {
      return '<div class="up-row is-done"><span class="up-ic">' + BB.icon("check", 18) + '</span><div class="up-txt"><b>' + BB_DOC_NAMES[id] + "</b><small>" + BB.escape(f.name) + " · " + AP.size(f.size) + "</small></div>" +
        '<label class="btn btn-small">Replace<input type="file" data-file="' + id + '" accept=".pdf,.jpg,.jpeg,.png" hidden></label>' +
        '<button class="icon-btn up-x" data-unfile="' + id + '" aria-label="Remove file">' + BB.icon("trash", 16) + "</button></div>";
    }
    return '<label class="up-row up-drop" data-drop="' + id + '"><span class="up-ic">' + BB.icon("file", 18) + '</span><div class="up-txt"><b>' + BB_DOC_NAMES[id] + "</b><small>PDF, JPG or PNG · drop a file here or browse</small></div>" +
      '<span class="btn btn-small btn-primary">' + BB.icon("upload", 15) + ' Upload</span><input type="file" data-file="' + id + '" accept=".pdf,.jpg,.jpeg,.png" hidden></label>';
  }).join("");
  return '<div class="panel glass"><div class="section-title"><span>Upload documents</span><span class="chip' + (n === req.length ? " chip-good" : "") + '">' + n + " of " + req.length + " uploaded</span></div>" +
    '<div class="up-bar"><i style="width:' + (n / req.length * 100) + '%"></i></div>' + rows +
    (n < req.length ? '<p class="muted ap-why">Upload ' + (req.length - n) + " more document" + (req.length - n > 1 ? "s" : "") + " to submit.</p>" : "") +
    '<div class="nav-row"><button class="btn" id="back">Back</button><button class="btn btn-primary" id="next">Continue to review</button></div></div>';
};
AP.takeFile = function (id, file) {
  if (!file) { return; }
  AP.form.files[id] = { name: file.name, size: file.size }; AP.save();
  BB.toast(BB_DOC_NAMES[id] + " uploaded."); AP.render();
};

/* ---------- 2. Your booth (shown above Things to note) ---------- */
AP.boothPanel = function () {
  var ev = AP.ev, types = BB.boothTypesFor(ev, AP.form.category), lock = AP.locked() ? " disabled" : "";
  var cats = ev.cats.map(function (c) { return '<option value="' + c + '"' + (AP.form.category === c ? " selected" : "") + ">" + BB_CATS[c].label + "</option>"; }).join("");
  var opts = '<option value="">Choose a booth type</option>' + types.map(function (t) { return '<option value="' + t.id + '"' + (AP.form.booth === t.id ? " selected" : "") + ">" + t.label + " · " + t.w + "m x " + t.d + "m · $" + BB.boothPrice(ev, t.id) + "/day</option>"; }).join("");
  var qty = '<div class="field"><span>Number of booths</span><div class="qty"><button type="button" data-qty="-1"' + (AP.form.qty <= 1 || lock ? " disabled" : "") + ' aria-label="Fewer booths">' + BB.icon("minus", 16) + "</button><b>" + AP.form.qty + '</b><button type="button" data-qty="1"' + (AP.form.qty >= BB.MAX_BOOTHS || lock ? " disabled" : "") + ' aria-label="More booths">' + BB.icon("plus", 16) + "</button></div><small class=\"muted\">Up to " + BB.MAX_BOOTHS + " per seller</small></div>";
  return '<div class="panel glass" ><div class="section-title">Your booth</div>' +
    '<div class="form-grid3"><label class="field"><span>Booth category</span><select class="select" id="f-cat"' + lock + ">" + cats + "</select></label>" +
    '<label class="field"><span>Booth type</span><select class="select" id="f-booth"' + lock + ">" + opts + "</select></label>" + qty + "</div>" +
    AP.placeHtml(lock) +
    '<label class="field" style="margin-bottom:0"><span>What will you sell? Add prices if you can.</span><textarea class="input" id="f-prod" rows="3"' + lock + ' placeholder="e.g. Brownies $4, banana loaf $9, cookie boxes $12">' + BB.escape(AP.form.products) + "</textarea></label></div>";
};

/* How more than one booth is placed. Only shown once there are 2 or more booths. */
AP.placeHtml = function (lock) {
  var n = AP.form.qty, off = lock ? " disabled" : "", t = AP.type();
  if (n < 2) { return ""; }
  var joined = t ? t.w * n + "m x " + t.d + "m" : "one wide";
  return '<div class="place"><span class="place-lbl">How should your ' + n + " booths be placed?</span>" +
    '<div class="place-opts">' +
      '<button type="button" class="place-opt' + (AP.form.together ? " is-on" : "") + '" data-together="1"' + off + '><span class="po-ic">' + BB.icon("booth", 18) + "</span><span><b>Side by side</b><small>Joined into one " + joined + " space, panels between them removed</small></span></button>" +
      '<button type="button" class="place-opt' + (AP.form.together ? "" : " is-on") + '" data-together="0"' + off + '><span class="po-ic">' + BB.icon("map", 18) + "</span><span><b>Separate spots</b><small>Fine to be apart, the organiser places each one where there is room</small></span></button></div>" +
    '<p class="place-note">' + BB.icon("clock", 13) + (AP.form.together ? " The organiser will keep them together. If the row is full, they will message you before placing them apart." : " You may get different booth numbers, even in different rows.") + "</p></div>";
};

/* step 3: Your booth (same fields and 2D plan as the latest version), then confirm and submit */
AP.step3 = function () {
  var blocked = AP.blockers() > 0, ready = !blocked && AP.type() && AP.form.agree;
  var why = blocked ? "Some documents are missing. Go back to the documents step." : (!AP.type() ? "Choose a booth type." : (!AP.form.agree ? "Tick the confirmation." : "You pay after the organiser accepts you."));
  return AP.boothPanel() +
    '<div class="panel glass submit-panel" style="margin-top:20px">' +
    '<label class="agree"><input type="checkbox" id="f-agree"' + (AP.form.agree ? " checked" : "") + '><span>I confirm my documents are accurate and I will follow the organiser rules.</span></label>' +
    '<div class="nav-row"><button class="btn" id="back">Back</button><button class="btn btn-primary" id="submit"' + (ready ? "" : " disabled") + ">Submit application</button></div>" +
    '<p class="muted ap-why" style="margin:10px 0 0">' + why + "</p></div>";
};

AP.done = function () {
  return '<div class="panel glass done"><div class="big">' + BB.icon("check") + "</div><h2>Application submitted</h2>" +
    '<p class="muted" style="font-size:17px;margin-bottom:22px">We added the result date to your deadlines. You will get a notification when ' + AP.ev.short + " replies.</p>" +
    '<div class="row" style="justify-content:center"><a class="btn btn-primary" href="my-events.html?event=' + AP.ev.id + '">Go to My Events</a><a class="btn" href="find-events.html">Keep browsing</a></div></div>';
};

/* ---------- Contact organiser (email) ---------- */
AP.contact = function () {
  var ev = AP.ev, det = AP.det, email = det.email || "";
  var box = document.createElement("div");
  box.className = "confirm-back";
  box.innerHTML = '<div class="confirm-box contact-box" role="dialog" aria-modal="true" aria-labelledby="ct-title">' +
    '<div class="ct-head"><span class="ct-ic">' + BB.icon("mail", 20) + '</span><div><h3 id="ct-title">Contact organiser</h3><small>' + BB.escape(det.organiser) + "</small></div>" +
    '<button class="icon-btn ct-x" data-c="no" aria-label="Close">' + BB.icon("x", 18) + "</button></div>" +
    '<div class="ct-to"><span>To</span><b>' + email + '</b><button class="btn btn-small" id="ct-copy">' + BB.icon("copy", 14) + " Copy</button></div>" +
    '<label class="field"><span>Subject</span><input class="input" id="ct-sub" value="Question about ' + BB.escape(ev.name) + '"></label>' +
    '<label class="field"><span>Message</span><textarea class="input" id="ct-msg" rows="4" placeholder="e.g. Can I bring my own table, or is one provided?"></textarea></label>' +
    '<p class="ct-note">' + BB.icon("clock", 14) + " The organiser usually replies within a day on weekdays.</p>" +
    '<div class="confirm-actions" style="justify-content:flex-end"><button class="btn" data-c="no">Cancel</button><button class="btn btn-primary" id="ct-send">' + BB.icon("mail", 16) + " Open in email app</button></div></div>";
  document.body.appendChild(box);
  var close = function () { box.remove(); document.removeEventListener("keydown", esc); };
  var esc = function (e) { if (e.key === "Escape") { close(); } };
  document.addEventListener("keydown", esc);
  box.addEventListener("click", function (e) { var b = e.target.closest("[data-c]"); if (e.target === box || b) { close(); } });
  box.querySelector("#ct-copy").addEventListener("click", function () {
    try { navigator.clipboard.writeText(email); } catch (err) {}
    BB.toast("Email address copied.");
  });
  box.querySelector("#ct-send").addEventListener("click", function () {
    var sub = box.querySelector("#ct-sub").value, msg = box.querySelector("#ct-msg").value;
    window.location.href = "mailto:" + email + "?subject=" + encodeURIComponent(sub) + "&body=" + encodeURIComponent(msg);
    close(); BB.toast("Opening your email app.");
  });
  box.querySelector("#ct-msg").focus();
};

/* ---------- Right side ---------- */
AP.payCard = function () {
  var ev = AP.ev, t = AP.type(), q = AP.q();
  var line = function (a, b, cls) { return '<div class="pay-line ' + (cls || "") + '"><span>' + a + "</span><b>" + b + "</b></div>"; };
  var head = '<div class="sum-card glass pay-card"><div class="pay-ev"><div class="img" style="' + BB.bg(ev) + '"></div><div><h3>' + ev.name + "</h3><small>" + ev.dates + " · " + ev.venue + "</small></div></div>" +
    '<button class="contact-btn" id="contact-org">' + BB.icon("mail", 16) + "<span>Contact organiser<small>" + BB.escape(AP.det.organiser) + "</small></span>" + BB.icon("chevRight", 16) + "</button>";
  if (!t) {
    return head + '<div class="pay-empty">' + BB.icon("booth", 20) + "<span>Choose a booth type to see your total.<small>Booths here start from " + BB.money(BB.priceFrom(ev)) + " a day.</small></span></div></div>";
  }
  return head +
    '<div class="pay-item"><div><b>' + t.label + "</b><small>" + t.w + "m x " + t.d + "m · " + BB.money(q.per) + "/day × " + q.days + " days × " + q.qty + " booth" + (q.qty > 1 ? "s" : "") + "</small></div><b>" + BB.money(q.sub) + "</b></div>" +
    line("Subtotal", BB.money(q.sub)) + line("GST (9%)", BB.money(q.gst)) + line("Security deposit <small>refundable, $" + BB.DEPOSIT + " per booth</small>", BB.money(q.deposit)) +
    '<div class="pay-total"><span>Total payable</span><b>' + BB.money(q.total) + "</b></div>" +
    '<p class="pay-note">' + BB.icon("clock", 14) + " Pay after you are accepted. Applications close " + BB.shortDate(ev.closes) + ".</p></div>";
};

AP.summary = function () {
  var ev = AP.ev, t = AP.type();
  var n = AP.form.qty, apart = n > 1 && !AP.form.together, plan;
  if (t && apart) {
    plan = '<div class="bx-sep">' + Array.apply(null, Array(n)).map(function (x, i) { return '<div class="bx-sep-one"><small>Booth ' + (i + 1) + "</small>" + BB.boothPlanSvg(t, 1) + "</div>"; }).join("") + "</div>" +
      '<p class="sep-note">' + BB.icon("map", 13) + " " + n + " separate booths. The organiser picks each spot.</p>";
  } else if (t) {
    plan = '<div class="bx-plan">' + BB.boothPlanSvg(t, n > 1 ? n : 1) + "</div>";
  }
  var booth = t ? '<div class="sum-card glass booth-card"><div class="section-title" style="font-size:17px"><span>' + t.label + '</span><span class="chip">' + (n > 1 ? (apart ? n + " x " + t.w + "m x " + t.d + "m" : t.w * n + "m x " + t.d + "m · " + n + " joined") : t.w + "m x " + t.d + "m") + "</span></div>" +
      plan + BB.amenityHtml(t, true) +
      '<a class="link-btn" style="padding:0;margin-top:12px;display:inline-block;font-size:14.5px" href="event-detail.html?event=' + ev.id + "&booth=" + t.id + '">See it in 3D</a></div>'
    : '<div class="sum-card glass booth-card empty">' + BB.icon("booth", 28) + "<p>Choose a booth type to see its floor plan and what comes with it.</p></div>";
  return '<aside class="ap-side">' + AP.payCard() + booth + "</aside>";
};

AP.render = function () {
  var body = AP.submitted ? AP.done() : (AP.step === 1 ? AP.step1() : (AP.step === 2 ? AP.step2() : AP.step3()));
  document.getElementById("root").innerHTML = '<a class="back-link" href="event-detail.html?event=' + AP.ev.id + '">' + BB.icon("chevLeft", 18) + " Back to event</a>" +
    '<h1 class="page-title">Apply to ' + AP.ev.short + "</h1><p class=\"page-sub\">Three quick steps. Things to note first, so you know what to expect.</p>" +
    (AP.submitted ? "" : AP.stepper()) + '<div class="ap-layout"><div>' + body + "</div>" + AP.summary() + "</div>";
  AP.wire();
  AP.fitSide();
  document.querySelectorAll(".ap-side img").forEach(function (im) { im.addEventListener("load", AP.fitSide); });
};

/* The right column sticks while you scroll, but never deeper than the screen:
   if it is taller than the window it scrolls with the page until its bottom shows, then sticks. */
AP.fitSide = function () {
  var side = document.querySelector(".ap-side"); if (!side) { return; }
  if (window.innerWidth <= 1000) { side.style.top = ""; return; }
  side.style.top = Math.min(110, window.innerHeight - side.offsetHeight - 16) + "px";
};

AP.wire = function () {
  var next = document.getElementById("next"), back = document.getElementById("back");
  if (next) { next.addEventListener("click", function () { AP.step += 1; AP.render(); window.scrollTo(0, 0); }); }
  if (back) { back.addEventListener("click", function () { AP.step -= 1; AP.render(); window.scrollTo(0, 0); }); }
  document.querySelectorAll("[data-file]").forEach(function (inp) { inp.addEventListener("change", function () { AP.takeFile(inp.getAttribute("data-file"), inp.files[0]); }); });
  document.querySelectorAll("[data-drop]").forEach(function (z) {
    z.addEventListener("dragover", function (e) { e.preventDefault(); z.classList.add("is-over"); });
    z.addEventListener("dragleave", function () { z.classList.remove("is-over"); });
    z.addEventListener("drop", function (e) { e.preventDefault(); AP.takeFile(z.getAttribute("data-drop"), e.dataTransfer.files[0]); });
  });
  document.querySelectorAll("[data-unfile]").forEach(function (b) { b.addEventListener("click", function () { delete AP.form.files[b.getAttribute("data-unfile")]; AP.save(); AP.render(); }); });
  document.querySelectorAll("[data-together]").forEach(function (b) { b.addEventListener("click", function () { AP.form.together = b.getAttribute("data-together") === "1"; AP.save(); AP.render(); }); });
  document.querySelectorAll("[data-qty]").forEach(function (b) { b.addEventListener("click", function () { AP.form.qty = Math.max(1, Math.min(BB.MAX_BOOTHS, AP.form.qty + parseInt(b.getAttribute("data-qty"), 10))); AP.save(); AP.render(); }); });
  var cat = document.getElementById("f-cat"), booth = document.getElementById("f-booth"), prod = document.getElementById("f-prod"), agree = document.getElementById("f-agree");
  if (cat) { cat.addEventListener("change", function () { AP.form.category = cat.value; if (AP.type() && AP.type().cat !== cat.value) { AP.form.booth = ""; } AP.save(); AP.render(); }); }
  if (booth) { booth.addEventListener("change", function () { AP.form.booth = booth.value; AP.save(); AP.render(); }); }
  if (prod) { prod.addEventListener("input", function () { AP.form.products = prod.value; AP.save(); }); }
  if (agree) { agree.addEventListener("change", function () { AP.form.agree = agree.checked; AP.save(); AP.render(); }); }
  var ct = document.getElementById("contact-org");
  if (ct) { ct.addEventListener("click", AP.contact); }
  var sub = document.getElementById("submit");
  if (sub) { sub.addEventListener("click", function () {
    BB.setStatus(AP.ev.id, "Applied");
    BB.addAutoDeadline({ title: AP.ev.short + " result expected", date: "2026-10-24", from: "10:00", to: "12:00", eventId: AP.ev.id, link: "my-events.html" });
    if (window.STUDY && STUDY.finish(AP.ev, AP.form)) { return; }
    AP.submitted = true; AP.render(); window.scrollTo(0, 0);
  }); }
};

document.addEventListener("DOMContentLoaded", function () {
  var ev = BB.eventById(parseInt(BB.param("event"), 10)) || BB_EVENTS[2];
  AP.ev = ev; AP.det = BB_DETAILS[ev.id];
  var saved = BB.read("localStorage", AP.key(), null);
  if (saved) { AP.form = saved; }
  var blank = { category: "", booth: "", qty: 1, together: true, products: "", agree: false, files: {} };
  for (var k in blank) { if (AP.form[k] === undefined) { AP.form[k] = blank[k]; } }
  if (!AP.form.category || ev.cats.indexOf(AP.form.category) === -1) { AP.form.category = ev.cats.indexOf(BB_USER.category) !== -1 ? BB_USER.category : ev.cats[0]; }
  window.addEventListener("resize", AP.fitSide);
  AP.render();
});

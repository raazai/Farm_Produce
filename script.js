(() => {
const CATS = ["Vegetables","Fruits","Grains & Pulses","Dairy & Eggs","Spices & Herbs"];
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
const today = () => day(0);
const fmtDate = d => new Date(d + "T00:00").toLocaleDateString("en-IN", {day:"numeric", month:"short"});

function seed() {
  return {
    farmers: [
      {id:"f1", name:"Gurpreet Singh", village:"Nakodar", bio:"Third-generation farmer growing vegetables on 6 acres. Pesticide use kept to a minimum."},
      {id:"f2", name:"Harjinder Kaur", village:"Shahkot", bio:"Runs a small dairy and poultry farm. Eggs and milk collected fresh every morning."},
      {id:"f3", name:"Baldev Raj", village:"Phillaur", bio:"Wheat, basmati and pulses on 15 acres. Sells in bulk to shops and families."},
      {id:"f4", name:"Sukhwinder Sandhu", village:"Jalandhar", bio:"Orchard owner with kinnow and guava. Also grows seasonal herbs."}
    ],
    listings: [
      {id:"l1", farmer:"f1", name:"Tomatoes", cat:"Vegetables", qty:120, unit:"kg", price:28, date:day(-1), note:"Hand-picked, firm"},
      {id:"l2", farmer:"f1", name:"Cauliflower", cat:"Vegetables", qty:80, unit:"kg", price:32, date:day(2), note:"Large heads"},
      {id:"l3", farmer:"f1", name:"Green chillies", cat:"Spices & Herbs", qty:25, unit:"kg", price:60, date:day(0), note:""},
      {id:"l4", farmer:"f2", name:"Farm eggs", cat:"Dairy & Eggs", qty:30, unit:"dozen", price:90, date:day(-2), note:"Free range"},
      {id:"l5", farmer:"f2", name:"Buffalo milk", cat:"Dairy & Eggs", qty:60, unit:"kg", price:55, date:day(-1), note:"Daily, delivered by 7 am"},
      {id:"l6", farmer:"f3", name:"Wheat", cat:"Grains & Pulses", qty:40, unit:"quintal", price:2275, date:day(5), note:"Cleaned and graded"},
      {id:"l7", farmer:"f3", name:"Basmati rice", cat:"Grains & Pulses", qty:12, unit:"quintal", price:5200, date:day(10), note:"Aged 1 year"},
      {id:"l8", farmer:"f4", name:"Kinnow", cat:"Fruits", qty:200, unit:"kg", price:40, date:day(3), note:"Sweet, juicy"},
      {id:"l9", farmer:"f4", name:"Guava", cat:"Fruits", qty:70, unit:"kg", price:45, date:day(-1), note:""},
      {id:"l10", farmer:"f4", name:"Mint", cat:"Spices & Herbs", qty:15, unit:"bunch", price:10, date:day(0), note:"Cut to order"}
    ],
    orders: []
  };
}
let db = JSON.parse(localStorage.getItem("mandi_db") || "null") || seed();
const save = () => localStorage.setItem("mandi_db", JSON.stringify(db));
const farmer = id => db.farmers.find(f => f.id === id) || {name:"Unknown", village:""};
const state = {cat:"All", me: localStorage.getItem("mandi_me") || "f1"};

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- navigation ---------- */
function show(view) {
  document.querySelectorAll(".view").forEach(v => v.hidden = v.id !== "view-" + view);
  document.querySelectorAll("#nav button").forEach(b => b.classList.toggle("on", b.dataset.view === view));
  ({market:renderMarket, farmers:renderFarmers, orders:renderOrders, sell:renderSell})[view]();
}
$("#nav").onclick = e => { const b = e.target.closest("button"); if (b) show(b.dataset.view); };

/* ---------- market ---------- */
function renderChips() {
  $("#chips").innerHTML = ["All", ...CATS].map(c =>
    `<button class="${c === state.cat ? "on" : ""}" data-c="${esc(c)}" aria-pressed="${c === state.cat}">${esc(c)}</button>`).join("");
}
$("#chips").onclick = e => { const b = e.target.closest("button"); if (b) { state.cat = b.dataset.c; renderMarket(); } };
["q","nowOnly","sort"].forEach(id => $("#" + id).addEventListener("input", renderMarket));

function availTag(l) {
  return l.date <= today() ? `<span class="tag now">Available now</span>` : `<span class="tag soon">Ready ${fmtDate(l.date)}</span>`;
}
function renderMarket() {
  renderChips();
  const q = $("#q").value.trim().toLowerCase();
  let items = db.listings.filter(l => l.qty > 0 &&
    (state.cat === "All" || l.cat === state.cat) &&
    (!$("#nowOnly").checked || l.date <= today()) &&
    (!q || [l.name, l.cat, l.note, farmer(l.farmer).name, farmer(l.farmer).village].join(" ").toLowerCase().includes(q)));
  const s = $("#sort").value;
  items.sort((a,b) => s === "low" ? a.price - b.price : s === "high" ? b.price - a.price : s === "qty" ? b.qty - a.qty : a.date.localeCompare(b.date));
  $("#count").textContent = items.length + (items.length === 1 ? " listing" : " listings");
  $("#grid").innerHTML = items.length ? items.map(l => {
    const f = farmer(l.farmer);
    return `<article class="card">
      <div>${availTag(l)} <span class="tag">${esc(l.cat)}</span></div>
      <h3>${esc(l.name)}</h3>
      <div class="price">₹${l.price}<small> / ${esc(l.unit)}</small></div>
      <div class="meta">${l.qty} ${esc(l.unit)} available${l.note ? " · " + esc(l.note) : ""}</div>
      <div class="bar" aria-hidden="true"><i style="width:${Math.min(100, l.qty)}%"></i></div>
      <div class="meta"><button class="link" data-f="${f.id}">${esc(f.name)}</button>, ${esc(f.village)}</div>
      <button class="btn" data-order="${l.id}">Request order</button>
    </article>`;}).join("") : `<p class="muted">No produce matches. Try another category or clear the search.</p>`;
}
$("#grid").onclick = e => {
  const o = e.target.closest("[data-order]"), f = e.target.closest("[data-f]");
  if (o) orderDialog(o.dataset.order); else if (f) farmerDialog(f.dataset.f);
};

/* ---------- farmers ---------- */
function renderFarmers() {
  $("#farmerGrid").innerHTML = db.farmers.map(f => {
    const n = db.listings.filter(l => l.farmer === f.id && l.qty > 0).length;
    return `<article class="card"><div class="fhead"><div class="avatar">${esc(f.name[0])}</div>
      <div><h3>${esc(f.name)}</h3><div class="meta">${esc(f.village)}, Punjab</div></div></div>
      <p>${esc(f.bio)}</p><div class="meta">${n} active ${n === 1 ? "listing" : "listings"}</div>
      <button class="btn alt" data-f="${f.id}">View profile</button></article>`;}).join("");
}
$("#farmerGrid").onclick = e => { const b = e.target.closest("[data-f]"); if (b) farmerDialog(b.dataset.f); };

function openDlg(html) { $("#dlgBody").innerHTML = html; const d = $("#dlg"); if (!d.open) d.showModal(); }
const closeDlg = () => $("#dlg").close();
$("#dlg").addEventListener("click", e => { if (e.target.id === "dlg" || e.target.dataset.close != null) closeDlg(); });

function farmerDialog(id) {
  const f = farmer(id), ls = db.listings.filter(l => l.farmer === id && l.qty > 0);
  openDlg(`<div class="fhead"><div class="avatar">${esc(f.name[0])}</div><div><h2>${esc(f.name)}</h2><div class="meta">${esc(f.village)}, Punjab</div></div></div>
    <p>${esc(f.bio)}</p><h3>Currently listed</h3>
    <div class="list">${ls.map(l => `<div class="item"><strong>${esc(l.name)}</strong>
      <span class="meta">${l.qty} ${esc(l.unit)} at ₹${l.price}/${esc(l.unit)}</span>${availTag(l)}
      <div class="acts"><button class="btn sm" data-o="${l.id}">Request order</button></div></div>`).join("") || "<p class='muted'>Nothing listed right now.</p>"}</div>
    <p><button class="btn alt" data-close>Close</button></p>`);
  $("#dlgBody").onclick = e => { const b = e.target.closest("[data-o]"); if (b) orderDialog(b.dataset.o); };
}

/* ---------- order request ---------- */
function orderDialog(id) {
  const l = db.listings.find(x => x.id === id), f = farmer(l.farmer);
  openDlg(`<h2>Request ${esc(l.name)}</h2>
    <p class="meta">From ${esc(f.name)}, ${esc(f.village)} · ₹${l.price}/${esc(l.unit)} · ${l.qty} ${esc(l.unit)} available</p>
    <form id="orderForm">
      <label>Your name<input name="buyer" required maxlength="40" value="${esc(localStorage.getItem("mandi_buyer") || "")}"></label>
      <label>Phone number<input name="phone" type="tel" required pattern="[0-9+ ]{10,14}" title="10 to 14 digits"></label>
      <div class="split">
        <label>Quantity (${esc(l.unit)})<input name="qty" type="number" min="1" max="${l.qty}" required></label>
        <label>Pickup date<input name="pickup" type="date" min="${l.date > today() ? l.date : today()}" required></label>
      </div>
      <label>Message (optional)<input name="msg" maxlength="100"></label>
      <p id="total" class="price"></p>
      <div class="acts"><button class="btn" type="submit">Send request</button><button class="btn alt" type="button" data-close>Cancel</button></div>
    </form>`);
  const form = $("#orderForm");
  form.qty.oninput = () => $("#total").textContent = form.qty.value ? "Estimated total: ₹" + (form.qty.value * l.price).toLocaleString("en-IN") : "";
  form.onsubmit = e => {
    e.preventDefault();
    db.orders.unshift({id:"o" + Date.now(), listing:l.id, farmer:l.farmer, crop:l.name, unit:l.unit, price:l.price,
      buyer:form.buyer.value.trim(), phone:form.phone.value.trim(), qty:+form.qty.value, pickup:form.pickup.value,
      msg:form.msg.value.trim(), status:"Pending", created:today()});
    localStorage.setItem("mandi_buyer", form.buyer.value.trim());
    save(); closeDlg(); toast("Request sent to " + f.name); renderMarket();
  };
}

/* ---------- buyer orders ---------- */
function renderOrders() {
  const inp = $("#buyerName"); inp.value = inp.value || localStorage.getItem("mandi_buyer") || "";
  const name = inp.value.trim().toLowerCase();
  const mine = name ? db.orders.filter(o => o.buyer.toLowerCase() === name) : [];
  $("#myOrders").innerHTML = mine.length ? mine.map(o => `<div class="item">
    <div><strong>${esc(o.crop)}</strong> <span class="tag st-${o.status.split(" ")[0]}">${esc(o.status)}</span></div>
    <div class="meta">${o.qty} ${esc(o.unit)} · ₹${(o.qty * o.price).toLocaleString("en-IN")} · pickup ${fmtDate(o.pickup)} · from ${esc(farmer(o.farmer).name)}</div>
    ${o.status === "Pending" ? `<div class="acts"><button class="btn bad sm" data-cancel="${o.id}">Cancel request</button></div>` : ""}
    ${o.status === "Ready for pickup" ? `<div class="meta">Ready now. Call ${esc(farmer(o.farmer).name)} to arrange pickup.</div>` : ""}</div>`).join("")
    : `<p class="muted">${name ? "No orders found for that name." : "Enter your name to see your orders."}</p>`;
}
$("#buyerName").oninput = renderOrders;
$("#myOrders").onclick = e => {
  const b = e.target.closest("[data-cancel]"); if (!b) return;
  db.orders.find(o => o.id === b.dataset.cancel).status = "Cancelled"; save(); renderOrders(); toast("Request cancelled");
};

/* ---------- farmer dashboard ---------- */
function renderSell() {
  $("#me").innerHTML = db.farmers.map(f => `<option value="${f.id}" ${f.id === state.me ? "selected" : ""}>${esc(f.name)} (${esc(f.village)})</option>`).join("");
  $("#catSel").innerHTML = CATS.map(c => `<option>${esc(c)}</option>`).join("");
  $("#listForm").date.min = "";
  const inc = db.orders.filter(o => o.farmer === state.me);
  $("#incoming").innerHTML = inc.length ? inc.map(o => `<div class="item">
    <div><strong>${esc(o.buyer)}</strong> wants ${o.qty} ${esc(o.unit)} of ${esc(o.crop)} <span class="tag st-${o.status.split(" ")[0]}">${esc(o.status)}</span></div>
    <div class="meta">Pickup ${fmtDate(o.pickup)} · ₹${(o.qty * o.price).toLocaleString("en-IN")} · ${esc(o.phone)}${o.msg ? " · “" + esc(o.msg) + "”" : ""}</div>
    <div class="acts">${actions(o)}</div></div>`).join("") : `<p class="muted">No requests yet. They will appear here.</p>`;
  const ls = db.listings.filter(l => l.farmer === state.me);
  $("#mine").innerHTML = ls.length ? ls.map(l => `<div class="item"><strong>${esc(l.name)}</strong>
    <div class="meta">${l.qty} ${esc(l.unit)} · ₹${l.price}/${esc(l.unit)} · ${l.date <= today() ? "available now" : "ready " + fmtDate(l.date)}</div>
    <div class="acts"><button class="btn bad sm" data-del="${l.id}">Remove</button></div></div>`).join("") : `<p class="muted">You have no listings yet.</p>`;
}
function actions(o) {
  const b = (to, label, cls = "") => `<button class="btn sm ${cls}" data-id="${o.id}" data-to="${to}">${label}</button>`;
  if (o.status === "Pending") return b("Accepted", "Accept") + b("Declined", "Decline", "bad");
  if (o.status === "Accepted") return b("Ready for pickup", "Mark ready");
  if (o.status === "Ready for pickup") return b("Completed", "Mark completed");
  return "";
}
$("#me").onchange = e => { state.me = e.target.value; localStorage.setItem("mandi_me", state.me); renderSell(); };
$("#incoming").onclick = e => {
  const b = e.target.closest("[data-to]"); if (!b) return;
  const o = db.orders.find(x => x.id === b.dataset.id), l = db.listings.find(x => x.id === o.listing);
  if (b.dataset.to === "Accepted") {
    if (!l || l.qty < o.qty) return toast("Not enough stock left to accept this request");
    l.qty -= o.qty;
  }
  o.status = b.dataset.to; save(); renderSell(); toast("Order " + o.status.toLowerCase());
};
$("#mine").onclick = e => {
  const b = e.target.closest("[data-del]"); if (!b) return;
  db.listings = db.listings.filter(l => l.id !== b.dataset.del); save(); renderSell(); toast("Listing removed");
};
$("#listForm").onsubmit = e => {
  e.preventDefault(); const f = e.target;
  db.listings.unshift({id:"l" + Date.now(), farmer:state.me, name:f.name.value.trim(), cat:f.cat.value,
    qty:+f.qty.value, unit:f.unit.value, price:+f.price.value, date:f.date.value, note:f.note.value.trim()});
  save(); f.reset(); renderSell(); toast("Listing published");
};
$("#reset").onclick = () => { if (confirm("Reset all demo data?")) { db = seed(); save(); show("market"); toast("Demo data restored"); } };

show("market");
})();

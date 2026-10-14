var expenses = [];
try {
  var saved = localStorage.getItem("studentExpenses");
  expenses = saved ? JSON.parse(saved) : [];
  if (!Array.isArray(expenses)) { expenses = []; }
} catch (e) { expenses = []; }

function saveExpenses() {
  try { localStorage.setItem("studentExpenses", JSON.stringify(expenses)); } catch (e) {}
}
function money(n) {
  return Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function esc(v) {
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function $(id) { return document.getElementById(id); }
function toast(msg) {
  var t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(function () { t.classList.remove("show"); }, 1800);
}
function showPage(id) {
  document.querySelectorAll(".page").forEach(function (p) { p.style.display = "none"; });
  $(id).style.display = "block";
  document.querySelectorAll("nav button").forEach(function (b) {
    b.classList.toggle("on", b.getAttribute("data-page") === id);
  });
  window.scrollTo(0, 0);
}
function itemHTML(item, withDelete) {
  var sub = esc(item.date) + " · " + esc(item.category);
  if (item.note) { sub += " · " + esc(item.note); }
  return "<div class=\"expense-item\"><div><strong>" + esc(item.name) + "</strong><small>" + sub +
    "</small></div><div style=\"text-align:right\"><div class=\"amt\">" + money(item.amount) + " บาท</div>" +
    (withDelete ? "<button type=\"button\" class=\"del\" data-id=\"" + esc(item.id) + "\">ลบ</button>" : "") +
    "</div></div>";
}

function render() {
  var total = 0, cats = {}, now = new Date(), monthTotal = 0, months = {};
  expenses.forEach(function (it) {
    var a = Number(it.amount || 0), c = it.category || "อื่น ๆ";
    total += a;
    cats[c] = (cats[c] || 0) + a;
    var d = new Date(it.date + "T00:00:00");
    if (isNaN(d)) { return; }
    var key = d.getFullYear() + "-" + d.getMonth();
    months[key] = (months[key] || 0) + a;
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) { monthTotal += a; }
  });
  $("total").textContent = money(total);
  $("count").textContent = expenses.length;
  $("monthTotal").textContent = money(monthTotal);

  var entries = Object.keys(cats).map(function (k) { return [k, cats[k]]; })
    .sort(function (a, b) { return b[1] - a[1]; });
  $("categoryChart").innerHTML = entries.length === 0
    ? "<p class=\"empty\">ยังไม่มีข้อมูล ไปที่แท็บ “บันทึก” เพื่อเพิ่มรายการแรก</p>"
    : entries.map(function (e) {
        var pct = total > 0 ? e[1] / total * 100 : 0;
        return "<div class=\"chart-item\"><div class=\"chart-label\"><span>" + esc(e[0]) + "</span><span>" +
          money(e[1]) + " บาท (" + pct.toFixed(0) + "%)</span></div><div class=\"bar-bg\"><div class=\"bar-fill\" style=\"width:" +
          pct + "%\"></div></div></div>";
      }).join("");

  var list = [], max = 0, i, d, v;
  for (i = 5; i >= 0; i--) {
    d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    v = months[d.getFullYear() + "-" + d.getMonth()] || 0;
    if (v > max) { max = v; }
    list.push({ label: d.toLocaleDateString("th-TH", { month: "short" }), v: v });
  }
  $("monthChart").innerHTML = list.map(function (m) {
    var h = max > 0 ? Math.round(m.v / max * 80) : 0;
    return "<div title=\"" + money(m.v) + " บาท\"><span>" + (m.v > 0 ? Math.round(m.v).toLocaleString("th-TH") : "") +
      "</span><i style=\"height:" + h + "%\"></i><span>" + esc(m.label) + "</span></div>";
  }).join("");

  var recent = expenses.slice(-5).reverse();
  $("recent").innerHTML = recent.length === 0
    ? "<p class=\"empty\">ยังไม่มีรายการค่าใช้จ่าย</p>"
    : recent.map(function (it) { return itemHTML(it, false); }).join("");

  renderHistory();
}

function renderHistory() {
  var kw = $("historySearch").value.trim().toLowerCase();
  var sel = $("historyCategory").value;
  var rows = expenses.filter(function (it) {
    var hit = String(it.name || "").toLowerCase().includes(kw) ||
      String(it.category || "").toLowerCase().includes(kw) ||
      String(it.date || "").includes(kw) ||
      String(it.note || "").toLowerCase().includes(kw);
    return hit && (sel === "all" || it.category === sel);
  }).slice().reverse();
  $("historyList").innerHTML = rows.length === 0
    ? "<p class=\"empty\">ไม่พบรายการค่าใช้จ่าย</p>"
    : rows.map(function (it) { return itemHTML(it, true); }).join("");
}

$("historyList").addEventListener("click", function (ev) {
  var btn = ev.target.closest(".del");
  if (!btn) { return; }
  if (!confirm("ลบรายการนี้ใช่ไหม")) { return; }
  var id = btn.getAttribute("data-id");
  expenses = expenses.filter(function (it) { return String(it.id) !== id; });
  saveExpenses();
  render();
  toast("ลบรายการแล้ว");
});

$("expenseForm").addEventListener("submit", function (ev) {
  ev.preventDefault();
  var date = $("date").value, name = $("name").value.trim();
  var amount = Number($("amount").value);
  if (!date || !name || !Number.isFinite(amount) || amount <= 0) {
    toast("กรอกข้อมูลให้ครบและใส่จำนวนเงินให้ถูกต้อง");
    return;
  }
  expenses.push({
    id: String(Date.now()) + Math.random().toString(16).slice(2),
    date: date, name: name, category: $("category").value,
    amount: amount, note: $("note").value.trim()
  });
  saveExpenses();
  this.reset();
  $("date").value = new Date().toLocaleDateString("en-CA");
  render();
  showPage("dashboard");
  toast("บันทึกรายจ่ายแล้ว");
});

$("historySearch").addEventListener("input", renderHistory);
$("historyCategory").addEventListener("change", renderHistory);
document.querySelectorAll("nav button").forEach(function (b) {
  b.addEventListener("click", function () { showPage(b.getAttribute("data-page")); });
});

$("date").value = new Date().toLocaleDateString("en-CA");
render();
showPage("dashboard");


(function () {
  const STORAGE_KEY = "vms_state_v2";
  const ROLE_TO_DASH = {
    admin: "dashboards/admin.html",
    client: "dashboards/client.html",
    technician: "dashboards/technician.html",
    "service-manager": "dashboards/service-manager.html",
    "stock-keeper": "dashboards/stock-keeper.html",
    "finance-manager": "dashboards/finance-manager.html",
    "data-analyst": "dashboards/data-analyst.html",
    "general-manager": "dashboards/general-manager.html",
  };

  
  function rootPrefix() {
    // This project uses a 1-level folder structure (auth/, dashboards/, client/, technician/, inventory/, analytics/, finance/)
    // If we're in a subfolder page, we need to go up one level to reach the root.
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.length <= 1 ? "" : "../";
  }
  function toRoot(p) { return rootPrefix() + p; }
function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Handle any errors here
    }
    return null;
  }

  function saveState(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function seed() {
    const s = {
      currentUser: null,
      users: [
        { email: "admin@vms.com", password: "password", role: "admin", name: "Admin User" },
        { email: "client@vms.com", password: "password", role: "client", name: "Jane Doe" },
        { email: "tech@vms.com", password: "password", role: "technician", name: "Mike Thompson" },
      ],
      inventory: [
        { sku: "OIL-5W30", name: "Synthetic Oil 5W-30", category: "Fluids", qty: 45, unit: "L", price: 8.5, reorder: 20 },
        { sku: "BP-1002", name: "Brake Pads (Front)", category: "Brakes", qty: 2, unit: "Units", price: 45, reorder: 15 },
        { sku: "SP-102", name: "Spark Plugs (Set)", category: "Ignition", qty: 24, unit: "Sets", price: 12, reorder: 10 },
      ],
      workOrders: [
        {
          id: "WO-4592", vehicle: "2019 Toyota Camry", license: "CAM-112", service: "Engine Diagnostics", status: "In Progress", priority: "High", complaint: "Check engine light is on, and the car shudders when accelerating above 40 mph.", notes: [
            { at: "Oct 24, 10:30 AM", text: "Scanned OBD-II, pulled code P0301 (Cylinder 1 Misfire). Inspecting spark plugs and ignition coil." }
          ]
        },
        { id: "WO-4595", vehicle: "2021 Ford Bronco", license: "XYZ-1234", service: "Brake Pad Rep.", status: "Waiting on Parts", priority: "Medium", complaint: "Grinding noise while braking." },
      ],
      appointments: [],
      payments: [],
    };
    saveState(s);
    return s;
  }
  function state() { return loadState() || seed(); }

  function toast(msg) {
    try {
      if (window.bootstrap) {
        const wrap = document.createElement("div");
        wrap.className = "toast-container position-fixed bottom-0 end-0 p-3";
        wrap.style.zIndex = 99999;
        wrap.innerHTML = `
          <div class="toast align-items-center border-0 glass-toast custom-toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
              <div class="toast-body fw-semibold">${msg}</div>
              <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
          </div>`;
        document.body.appendChild(wrap);
        const t = wrap.querySelector(".toast");
        const bs = new bootstrap.Toast(t, { delay: 2200 });
        bs.show();
        t.addEventListener("hidden.bs.toast", () => wrap.remove());
      } else {
        alert(msg);
      }
    } catch { alert(msg); }
  }

  function dashboardHref() {
    const s = state();
    const role = s.currentUser?.role || "admin";
    return toRoot(ROLE_TO_DASH[role] || ROLE_TO_DASH.admin);
  }

  function addTopbarBackButton() {
  // Skip on auth pages, dashboards, and homepage
  const authPages = [/login\.html$/, /register\.html$/, /forgot-password\.html$/, /change-password\.html$/];
  if (authPages.some(p => p.test(location.pathname))) return;
  if (location.pathname.includes("/dashboards/")) return;
  if (location.pathname.endsWith("/index.html") || location.pathname.endsWith("index.html")) return;

  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  // Find a title element inside topbar (most pages use h5)
  const title = topbar.querySelector("h1,h2,h3,h4,h5,h6");
  if (!title) return;

  // Don't add twice, and don't override pages that already have an arrow link
  if (title.querySelector(".topbar-back-btn")) return;
  if (title.querySelector("a i.bi-arrow-left") || title.querySelector("i.bi-arrow-left")) return;

  const a = document.createElement("a");
  a.href = "#";
  a.className = "topbar-back-btn";
  a.setAttribute("aria-label", "Back");
  a.title = "Back";
  a.innerHTML = '<i class="bi bi-arrow-left"></i>';

  a.addEventListener("click", (e) => {
    e.preventDefault();
    if (window.history.length > 1) window.history.back();
    else location.href = dashboardHref();
  });

  // Ensure title uses flex alignment when we prepend button
  title.classList.add("d-flex", "align-items-center");
  a.classList.add("me-2");
  title.prepend(a);
}

  function wireTheme() {
    const btn = document.getElementById("themeSwitch");
    if (!btn) return;
    const k = "vms_theme";
    const saved = localStorage.getItem(k);
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "light";
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(k, next);
    });
  }


  function wireLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const methodEl = document.querySelector('input[name="paymentMethod"]:checked');
const method = methodEl ? methodEl.value : '';
if (method === 'card') {
  const res = validateCardPayment({
    cardNumber: cardNumber ? cardNumber.value : '',
    expiry: expiryDate ? expiryDate.value : '',
    cvv: cvv ? cvv.value : ''
  });
  if (!res.ok) { toast(res.msg); return; }
}

const selectedRole = form.querySelector("#roleSelect")?.value || "admin";

      const s = state();
      s.currentUser = {
        email: "demo@vms.com",
        name: "Demo User",
        role: selectedRole
      };
      saveState(s);

      const dashUrl = toRoot(ROLE_TO_DASH[selectedRole] || ROLE_TO_DASH.admin);

      toast("Logged in!");
      setTimeout(() => location.href = dashUrl, 250);
    });
  }
  function wireRegister() {
    const form = document.getElementById("registerForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const inputs = form.querySelectorAll("input");
      const first = inputs[0]?.value?.trim() || "User";
      const last = inputs[1]?.value?.trim() || "";
      const email = inputs[2]?.value?.trim() || "";
      const p1 = inputs[3]?.value || "";
      const p2 = inputs[4]?.value || "";
      if (p1 !== p2) { toast("Passwords do not match."); return; }

      const s = state();
      if (s.users.some(u => u.email.toLowerCase() === email.toLowerCase())) { toast("Email already exists."); return; }
      s.users.push({ email, password: p1, role: "client", name: `${first} ${last}`.trim() });
      s.currentUser = { email, role: "client", name: `${first} ${last}`.trim() };
      saveState(s);
      toast("Account created. Redirecting to Client Dashboard...");
      setTimeout(() => location.href = toRoot(ROLE_TO_DASH.client), 250);
      });
  }

  // ---- Work Orders ----
  function wireWorkOrders() {
    const table = document.getElementById("workOrdersTable");
    const search = document.getElementById("woSearch");
    if (!table || !search) return;

    const s = state();

    function priBadge(p) { return p === "High" ? "bg-danger" : (p === "Medium" ? "bg-warning text-dark" : "bg-secondary"); }
    function stBadge(st) { return st === "In Progress" ? "bg-primary" : (st === "Waiting on Parts" ? "bg-warning text-dark" : "bg-secondary"); }

    function render(rows) {
      const tbody = table.querySelector("tbody");
      tbody.innerHTML = rows.map(wo => `
        <tr>
          <td>#${wo.id}</td>
          <td>${wo.vehicle}</td>
          <td>${wo.service}</td>
          <td><span class="badge ${priBadge(wo.priority)}">${wo.priority}</span></td>
          <td><span class="badge ${stBadge(wo.status)}">${wo.status}</span></td>
          <td><a class="btn btn-sm btn-outline-primary" href="work-order-details.html?wo=${encodeURIComponent(wo.id)}">Open</a></td>
        </tr>
      `).join("");
    }

    render(s.workOrders);

    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      render(s.workOrders.filter(w =>
        w.id.toLowerCase().includes(q) ||
        w.vehicle.toLowerCase().includes(q) ||
        w.service.toLowerCase().includes(q) ||
        w.status.toLowerCase().includes(q)
      ));
    });
  }

  function wireWorkOrderDetails() {
    if (!location.pathname.includes("work-order-details.html")) return;
    const s = state();
    const url = new URL(location.href);
    const id = url.searchParams.get("wo") || "WO-4592";
    const wo = s.workOrders.find(w => w.id === id) || s.workOrders[0];
    if (!wo) return;

    // Header title "WO-xxxx Details"
    const header = document.querySelector(".topbar h5");
    if (header) header.innerHTML = `<a href="work-orders.html" class="topbar-back-btn"><i class="bi bi-arrow-left"></i></a>${wo.id} Details`;

    // Service title
    const title = document.querySelector("h4.fw-bold");
    if (title) title.textContent = wo.service;

    // Vehicle info
    const info = document.querySelectorAll(".row.mb-4 .col-sm-4 strong");
    if (info.length >= 2) {
      info[0].textContent = wo.vehicle;
      info[1].textContent = wo.license || "-";
    }

    // Complaint
    const complaint = document.querySelector("p.bg-light-subtle");
    if (complaint) complaint.textContent = `"${wo.complaint || "No complaint provided."}"`;

    // Notes render
    const container = document.querySelector(".card-body");
    const existingAlerts = container ? container.querySelectorAll(".alert.alert-secondary") : [];
    if (container && existingAlerts.length) {
      const wrap = existingAlerts[0].parentElement;
      wrap.innerHTML = (wo.notes || []).map(n => `<div class="alert alert-secondary"><strong>${n.at}:</strong> ${n.text}</div>`).join("") || `<div class="alert alert-light border">No notes yet.</div>`;
    }

    // Mark complete
    const btn = document.querySelector(".btn.btn-success");
    if (btn) {
      btn.addEventListener("click", () => {
        wo.status = "Completed";
        saveState(s);
        toast("Work order completed.");
        setTimeout(() => location.href = "work-orders.html", 250);
      });
    }
  }

  // ---- Appointments ----
  function wireAppointments() {
    const form = document.getElementById("appointmentForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const s = state();
      const fields = form.querySelectorAll("input, select, textarea");
      const data = {};
      fields.forEach(el => {
        if (!el.name && !el.id) return;
        const key = el.name || el.id;
        if (el.type === "checkbox") data[key] = el.checked;
        else data[key] = el.value;
      });
      s.appointments.push({ at: new Date().toISOString(), ...data });
      saveState(s);
      toast("Appointment booked (demo).");
      setTimeout(() => location.href = toRoot(ROLE_TO_DASH.client), 250);
    });
  }

  // ---- Payments (demo) ----
  function validateCardPayment({ cardNumber, expiry, cvv }) {
  const digits = (cardNumber || "").replace(/\D/g, "");
  const cvvDigits = (cvv || "").replace(/\D/g, "");

  if (digits.length === 0) return { ok: false, msg: "Card number is required." };
  if (digits.length > 16) return { ok: false, msg: "Card number must not be more than 16 digits." };
  if (digits.length < 13) return { ok: false, msg: "Card number looks too short." };

  if (cvvDigits.length === 0) return { ok: false, msg: "CVV is required." };
  if (cvvDigits.length > 4) return { ok: false, msg: "CVV must not be more than 4 digits." };
  if (cvvDigits.length < 3) return { ok: false, msg: "CVV must be 3 or 4 digits." };

  const exp = (expiry || "").trim();
  const m = exp.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!m) return { ok: false, msg: "Expiry must be in MM/YY format." };

  const mm = parseInt(m[1], 10);
  const yy = parseInt(m[2], 10);
  const year = 2000 + yy;

  const expDate = new Date(year, mm, 0, 23, 59, 59, 999);
  const now = new Date();
  if (expDate <= now) return { ok: false, msg: "Expiry date must be in the future." };

  return { ok: true };
}

  function wirePayments() {
    const form = document.getElementById("paymentForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const s = state();
      s.payments.push({ at: new Date().toISOString(), amount: "demo" });
      saveState(s);
      toast("Payment processed (demo).");
      setTimeout(() => location.href = toRoot(ROLE_TO_DASH.client), 250);
    });
  }

// ---- Admin: User Management (demo) ----
function ensureUserPerms(u) {
  if (!u.permissions) {
    // sensible defaults by role (demo)
    const role = u.role || "client";
    const base = ["appointments"];
    const map = {
      admin: ["admin","appointments","work_orders","inventory","finance","analytics"],
      client: ["appointments"],
      technician: ["work_orders"],
      "service-manager": ["appointments","work_orders"],
      "stock-keeper": ["inventory"],
      "finance-manager": ["finance"],
      "data-analyst": ["analytics"],
      "general-manager": ["analytics","finance","inventory","work_orders","appointments"],
    };
    u.permissions = map[role] || base;
  }
  return u;
}

function wireAdminUsers() {
  // Only on admin dashboard
  if (!location.pathname.includes("/dashboards/admin.html")) return;

  const table = document.getElementById("adminUsersTable");
  const search = document.getElementById("adminUserSearch");
  const btnCreate = document.getElementById("btnCreateUser");
  const modalEl = document.getElementById("userModal");
  const permModalEl = document.getElementById("permModal");
  if (!table || !search || !btnCreate || !modalEl || !permModalEl) return;

  const bsModal = window.bootstrap ? new bootstrap.Modal(modalEl) : null;
  const bsPermModal = window.bootstrap ? new bootstrap.Modal(permModalEl) : null;

  const s = state();
  s.users = (s.users || []).map(ensureUserPerms);
  saveState(s);

  function badgeList(perms) {
    const p = (perms || []).slice(0, 4);
    const more = (perms || []).length - p.length;
    const chips = p.map(x => `<span class="badge bg-primary-subtle text-primary border me-1">${x}</span>`).join("");
    return chips + (more > 0 ? `<span class="badge bg-secondary-subtle text-secondary border">+${more}</span>` : "");
  }

  function render(rows) {
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = rows.map(u => `
      <tr>
        <td class="fw-semibold">${u.name || "-"}</td>
        <td>${u.email || "-"}</td>
        <td><span class="badge bg-light text-dark border">${u.role || "client"}</span></td>
        <td>${badgeList(u.permissions)}</td>
        <td>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-sm btn-outline-primary" data-action="edit" data-email="${encodeURIComponent(u.email)}">
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-secondary" data-action="perms" data-email="${encodeURIComponent(u.email)}">
              <i class="bi bi-shield-lock"></i> Permissions
            </button>
            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-email="${encodeURIComponent(u.email)}">
              <i class="bi bi-trash"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function currentRows() {
    const q = search.value.trim().toLowerCase();
    const s2 = state();
    const users = (s2.users || []).map(ensureUserPerms);
    if (!q) return users;
    return users.filter(u =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  }

  function refresh() {
    render(currentRows());
  }

  // ---- Create / Edit modal helpers ----
  const f = document.getElementById("userForm");
  const title = document.getElementById("userModalTitle");
  const emailOriginal = document.getElementById("userFormEmailOriginal");
  const nameEl = document.getElementById("userFormName");
  const emailEl = document.getElementById("userFormEmail");
  const passEl = document.getElementById("userFormPassword");
  const roleEl = document.getElementById("userFormRole");

  function openCreate() {
    title.textContent = "New User";
    emailOriginal.value = "";
    nameEl.value = "";
    emailEl.value = "";
    passEl.value = "";
    roleEl.value = "client";
    bsModal ? bsModal.show() : null;
  }

  function openEdit(user) {
    title.textContent = "Edit User";
    emailOriginal.value = user.email || "";
    nameEl.value = user.name || "";
    emailEl.value = user.email || "";
    passEl.value = user.password || "password";
    roleEl.value = user.role || "client";
    bsModal ? bsModal.show() : null;
  }

  btnCreate.addEventListener("click", openCreate);

  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const s3 = state();
    s3.users = (s3.users || []).map(ensureUserPerms);

    const original = (emailOriginal.value || "").toLowerCase();
    const email = (emailEl.value || "").trim();
    const emailKey = email.toLowerCase();

    if (!email) { toast("Email is required."); return; }

    // Prevent duplicate emails (except when editing same user)
    const exists = (s3.users || []).some(u => (u.email || "").toLowerCase() === emailKey && (u.email || "").toLowerCase() !== original);
    if (exists) { toast("Email already exists."); return; }

    const role = roleEl.value || "client";
    const name = nameEl.value.trim() || "User";
    const password = passEl.value || "password";

    if (original) {
      // Edit
      const u = s3.users.find(x => (x.email || "").toLowerCase() === original);
      if (!u) { toast("User not found."); return; }
      u.email = email;
      u.name = name;
      u.password = password;
      u.role = role;
      ensureUserPerms(u);
      toast("User updated.");
    } else {
      // Create
      const u = { email, name, password, role };
      ensureUserPerms(u);
      s3.users.push(u);
      toast("User created.");
    }

    saveState(s3);
    bsModal ? bsModal.hide() : null;
    refresh();
  });

  // ---- Permissions modal ----
  const permUserEmail = document.getElementById("permUserEmail");
  const permEmail = document.getElementById("permEmail");
  const permForm = document.getElementById("permForm");

  const permMap = {
    appointments: document.getElementById("permAppointments"),
    work_orders: document.getElementById("permWorkOrders"),
    inventory: document.getElementById("permInventory"),
    finance: document.getElementById("permFinance"),
    analytics: document.getElementById("permAnalytics"),
    admin: document.getElementById("permAdmin"),
  };

  function openPerms(user) {
    permUserEmail.textContent = user.email || "";
    permEmail.value = user.email || "";
    const perms = new Set(user.permissions || []);
    Object.entries(permMap).forEach(([k, el]) => { if (el) el.checked = perms.has(k); });
    bsPermModal ? bsPermModal.show() : null;
  }

  permForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const s4 = state();
    const email = (permEmail.value || "").toLowerCase();
    const u = (s4.users || []).find(x => (x.email || "").toLowerCase() === email);
    if (!u) { toast("User not found."); return; }
    const selected = Object.entries(permMap).filter(([k, el]) => el && el.checked).map(([k]) => k);
    u.permissions = selected;
    saveState(s4);
    toast("Permissions saved.");
    bsPermModal ? bsPermModal.hide() : null;
    refresh();
  });

  // ---- Row actions ----
  table.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    const email = decodeURIComponent(btn.getAttribute("data-email") || "");
    const s5 = state();
    const u = (s5.users || []).map(ensureUserPerms).find(x => (x.email || "") === email);
    if (!u) { toast("User not found."); return; }

    if (action === "edit") {
      openEdit(u);
    } else if (action === "perms") {
      openPerms(u);
    } else if (action === "delete") {
      const isCurrent = (s5.currentUser?.email || "").toLowerCase() === (u.email || "").toLowerCase();
      if (isCurrent) { toast("You can't delete the current user (demo)."); return; }
      s5.users = (s5.users || []).filter(x => (x.email || "") !== email);
      saveState(s5);
      toast("User deleted.");
      refresh();
    }
  });

  // Search
  search.addEventListener("input", refresh);

  refresh();
}


  document.addEventListener("DOMContentLoaded", () => {
    if (!document.body.classList.contains("vms-app")) document.body.classList.add("vms-app");    addTopbarBackButton();
    wireTheme();

    wireLogin();
    wireRegister();

    wireWorkOrders();
    wireWorkOrderDetails();

    wireAppointments();
    wirePayments();

    wireAdminUsers();
  });
})();



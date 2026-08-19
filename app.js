const STORAGE_KEY = "factures-coaching-v1";
const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

const defaultProfile = {
  businessName: "Votre activité de coaching", legalForm: "", businessAddress: "",
  businessEmail: "", businessPhone: "", siret: "", vatMode: "franchise",
  vatRate: "20", vatNumber: "", paymentDays: "30",
  paymentTerms: "Paiement à réception de facture. En cas de retard de paiement, des pénalités pourront être appliquées selon les conditions convenues."
};

let data = loadData();
let draftLines = [newLine()];
let toastTimer;

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { profile: { ...defaultProfile, ...(saved?.profile || {}) }, clients: saved?.clients || [], invoices: saved?.invoices || [] };
  } catch { return { profile: { ...defaultProfile }, clients: [], invoices: [] }; }
}
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function id() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function newLine() { return { id: id(), description: "Séance de coaching", quantity: 1, price: 0 }; }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(date, days) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + Number(days || 0)); return d.toISOString().slice(0, 10); }
function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]); }
function totalFor(lines) { const subtotal = lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.price || 0), 0); const rate = data.profile.vatMode === "tva" ? Number(data.profile.vatRate) / 100 : 0; return { subtotal, vat: subtotal * rate, total: subtotal * (1 + rate) }; }
function statusLabel(status) { return status === "paid" ? "Payée" : "Brouillon"; }

function showToast(message) { const toast = document.querySelector("#toast"); toast.textContent = message; toast.classList.add("toast-visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("toast-visible"), 2800); }
function goTo(view) { document.querySelectorAll(".view").forEach(item => item.classList.toggle("active", item.id === view)); document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("active", item.dataset.view === view)); window.scrollTo({ top: 0, behavior: "smooth" }); }

function renderAll() {
  const profile = data.profile;
  document.querySelector("#business-greeting").textContent = profile.businessName || "votre activité";
  renderClients(); renderInvoiceClientOptions(); renderLines(); renderDashboard(); renderHistory(); renderProfile();
  document.querySelector("#profile-warning").style.display = profile.siret.trim() ? "none" : "flex";
  document.querySelector("#vat-total-row").style.display = profile.vatMode === "tva" ? "flex" : "none";
}

function renderClients() {
  const list = document.querySelector("#clients-list");
  document.querySelector("#client-list-subtitle").textContent = `${data.clients.length} client${data.clients.length > 1 ? "s" : ""}`;
  if (!data.clients.length) { list.className = "client-list empty-state compact"; list.innerHTML = "<span>◉</span><p>Votre carnet d'adresses est vide.</p>"; return; }
  list.className = "client-list";
  list.innerHTML = data.clients.map(client => `<article class="client-card"><div><strong>${escapeHtml(client.name)}</strong><small>${escapeHtml(client.email || client.address || "Aucune coordonnée ajoutée")}</small></div><button class="delete-button" data-delete-client="${client.id}" title="Supprimer">Supprimer</button></article>`).join("");
}

function renderInvoiceClientOptions() {
  const select = document.querySelector("#invoice-client"); const selected = select.value;
  select.innerHTML = `<option value="">Choisir un client…</option>${data.clients.map(client => `<option value="${client.id}">${escapeHtml(client.name)}</option>`).join("")}`;
  select.value = selected;
}

function renderLines() {
  const body = document.querySelector("#invoice-lines");
  body.innerHTML = draftLines.map(line => `<tr data-line-id="${line.id}"><td><input class="line-description" value="${escapeHtml(line.description)}" aria-label="Prestation" placeholder="Prestation" /></td><td><input class="line-quantity quantity" type="number" min="0" step="0.5" value="${line.quantity}" aria-label="Quantité" /></td><td><input class="line-price price" type="number" min="0" step="0.01" value="${line.price}" aria-label="Prix unitaire HT" /></td><td class="total">${euro.format(Number(line.quantity || 0) * Number(line.price || 0))}</td><td><button type="button" class="remove-line" data-remove-line="${line.id}" aria-label="Supprimer la ligne">×</button></td></tr>`).join("");
  const totals = totalFor(draftLines);
  document.querySelector("#total-ht").textContent = euro.format(totals.subtotal); document.querySelector("#total-vat").textContent = euro.format(totals.vat); document.querySelector("#total-ttc").textContent = euro.format(totals.total);
}

function renderDashboard() {
  document.querySelector("#client-count").textContent = data.clients.length;
  document.querySelector("#invoice-count").textContent = data.invoices.length;
  const outstanding = data.invoices.filter(invoice => invoice.status !== "paid").reduce((sum, invoice) => sum + invoice.total, 0);
  document.querySelector("#outstanding-total").textContent = euro.format(outstanding);
  const recent = data.invoices.slice().sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const box = document.querySelector("#recent-invoices");
  if (!recent.length) { box.className = "empty-state"; box.innerHTML = "<span>▤</span><p>Aucune facture pour le moment.</p><button class=\"secondary-button\" data-go-to=\"invoices\">Créer ma première facture</button>"; return; }
  box.className = "";
  box.innerHTML = invoiceTable(recent, true);
}

function invoiceTable(invoices, short = false) {
  return `<div class="line-items-wrap"><table class="invoice-table"><thead><tr><th>Numéro</th><th>Client</th><th>Date</th><th>Montant</th><th>Statut</th><th></th></tr></thead><tbody>${invoices.map(invoice => { const client = data.clients.find(item => item.id === invoice.clientId); return `<tr><td><strong>${escapeHtml(invoice.number)}</strong></td><td>${escapeHtml(client?.name || invoice.clientName || "Client supprimé")}</td><td>${new Date(`${invoice.date}T12:00:00`).toLocaleDateString("fr-FR")}</td><td>${euro.format(invoice.total)}</td><td><button class="status-button" data-toggle-status="${invoice.id}"><span class="status ${invoice.status}">${statusLabel(invoice.status)}</span></button></td><td><button class="action-link" data-open-invoice="${invoice.id}">Voir</button></td></tr>`; }).join("")}</tbody></table></div>`;
}
function renderHistory() { const box = document.querySelector("#history-table"); if (!data.invoices.length) { box.className = "empty-state"; box.innerHTML = "<span>◷</span><p>Aucune facture enregistrée.</p>"; } else { box.className = ""; box.innerHTML = invoiceTable(data.invoices.slice().sort((a,b) => b.createdAt.localeCompare(a.createdAt))); } }

function renderProfile() {
  const form = document.querySelector("#profile-form"); Object.entries(data.profile).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value; });
  form.querySelectorAll(".vat-only").forEach(element => element.style.display = data.profile.vatMode === "tva" ? "grid" : "none");
}

function nextNumber(date) { const year = (date || today()).slice(0, 4); const currentYear = data.invoices.filter(invoice => invoice.number.startsWith(`${year}-`)).length + 1; return `${year}-${String(currentYear).padStart(3, "0")}`; }
function collectLines() { return draftLines.map(line => ({ ...line, description: line.description.trim() })).filter(line => line.description && Number(line.quantity) > 0); }

function makeInvoiceFromForm() {
  const clientId = document.querySelector("#invoice-client").value; const client = data.clients.find(item => item.id === clientId); const lines = collectLines();
  if (!clientId || !client) { showToast("Choisissez d'abord un client."); return null; }
  if (!lines.length) { showToast("Ajoutez au moins une prestation avec une quantité."); return null; }
  const date = document.querySelector("#invoice-date").value; const dueDate = document.querySelector("#invoice-due-date").value;
  if (!date || !dueDate) { showToast("Ajoutez la date et l'échéance."); return null; }
  const totals = totalFor(lines);
  return { id: id(), number: nextNumber(date), clientId, clientName: client.name, date, dueDate, lines, note: document.querySelector("#invoice-note").value.trim(), subtotal: totals.subtotal, vat: totals.vat, total: totals.total, status: "draft", profileSnapshot: { ...data.profile }, createdAt: new Date().toISOString() };
}

function invoiceMarkup(invoice) {
  const client = data.clients.find(item => item.id === invoice.clientId) || { name: invoice.clientName, address: "" };
  const profile = invoice.profileSnapshot || data.profile; const vatNote = profile.vatMode === "franchise" ? "TVA non applicable, art. 293 B du CGI." : `TVA ${profile.vatRate} %${profile.vatNumber ? ` — ${profile.vatNumber}` : ""}`;
  return `<div class="sheet-heading"><div class="sheet-identity"><img class="sheet-logo" src="alex-coaching-logo.jpeg" alt="Logo Alex Coaching" /><div><div class="sheet-brand">${escapeHtml(profile.businessName || "Votre activité de coaching")}</div><p>${escapeHtml(profile.legalForm)}<br>${escapeHtml(profile.businessAddress)}<br>${escapeHtml(profile.businessEmail)}${profile.businessPhone ? `<br>${escapeHtml(profile.businessPhone)}` : ""}</p></div></div><div class="sheet-title">FACTURE<small>N° ${escapeHtml(invoice.number)}<br>Émise le ${new Date(`${invoice.date}T12:00:00`).toLocaleDateString("fr-FR")}</small></div></div><div class="sheet-parties"><div><p class="sheet-label">Facturé à</p><p><strong>${escapeHtml(client.name)}</strong><br>${escapeHtml(client.address || "Adresse à compléter")}</p></div><div><p class="sheet-label">Règlement</p><p>Échéance : ${new Date(`${invoice.dueDate}T12:00:00`).toLocaleDateString("fr-FR")}<br>${escapeHtml(vatNote)}</p></div></div><table class="sheet-table"><thead><tr><th>PRESTATION</th><th>QTÉ</th><th>PRIX UNIT. HT</th><th class="sheet-amount">TOTAL HT</th></tr></thead><tbody>${invoice.lines.map(line => `<tr><td>${escapeHtml(line.description)}</td><td>${line.quantity}</td><td>${euro.format(line.price)}</td><td class="sheet-amount">${euro.format(line.quantity * line.price)}</td></tr>`).join("")}</tbody></table><div class="sheet-sum"><p><span>Total HT</span><strong>${euro.format(invoice.subtotal)}</strong></p>${profile.vatMode === "tva" ? `<p><span>TVA</span><strong>${euro.format(invoice.vat)}</strong></p>` : ""}<p class="sheet-grand"><span>Total à régler</span><strong>${euro.format(invoice.total)}</strong></p></div>${invoice.note ? `<div class="sheet-terms"><strong>Note</strong><br>${escapeHtml(invoice.note)}</div>` : ""}<div class="sheet-terms"><strong>Conditions de règlement</strong><br>${escapeHtml(profile.paymentTerms)}<br><br>SIRET : ${escapeHtml(profile.siret || "À compléter avant émission")}</div><div class="sheet-footer">${escapeHtml(profile.businessName || "Votre activité de coaching")} · Facture ${escapeHtml(invoice.number)}</div>`;
}
function openInvoice(invoice) { document.querySelector("#printable-invoice").innerHTML = invoiceMarkup(invoice); document.querySelector("#invoice-modal").classList.add("open"); document.querySelector("#invoice-modal").setAttribute("aria-hidden", "false"); }
function closeModal() { document.querySelector("#invoice-modal").classList.remove("open"); document.querySelector("#invoice-modal").setAttribute("aria-hidden", "true"); }

document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => goTo(button.dataset.view)));
document.addEventListener("click", event => {
  const go = event.target.closest("[data-go-to]"); if (go) goTo(go.dataset.goTo);
  const remove = event.target.closest("[data-remove-line]"); if (remove) { if (draftLines.length > 1) { draftLines = draftLines.filter(line => line.id !== remove.dataset.removeLine); renderLines(); } else { showToast("Une facture doit conserver au moins une ligne."); } }
  const deleteClient = event.target.closest("[data-delete-client]"); if (deleteClient) { const id = deleteClient.dataset.deleteClient; const used = data.invoices.some(invoice => invoice.clientId === id); if (used) { showToast("Ce client est lié à une facture et ne peut pas être supprimé."); return; } data.clients = data.clients.filter(client => client.id !== id); saveData(); renderAll(); showToast("Client supprimé."); }
  const toggle = event.target.closest("[data-toggle-status]"); if (toggle) { const invoice = data.invoices.find(item => item.id === toggle.dataset.toggleStatus); invoice.status = invoice.status === "paid" ? "draft" : "paid"; saveData(); renderAll(); }
  const open = event.target.closest("[data-open-invoice]"); if (open) openInvoice(data.invoices.find(item => item.id === open.dataset.openInvoice));
  if (event.target.closest("[data-close-modal]")) closeModal();
});
document.querySelector("#client-form").addEventListener("submit", event => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); data.clients.push({ id: id(), ...values }); saveData(); event.currentTarget.reset(); renderAll(); showToast("Client enregistré."); });
document.querySelector("#add-line").addEventListener("click", () => { draftLines.push(newLine()); renderLines(); });
document.querySelector("#invoice-lines").addEventListener("change", event => { const row = event.target.closest("tr"); if (!row) return; const line = draftLines.find(item => item.id === row.dataset.lineId); if (event.target.classList.contains("line-description")) line.description = event.target.value; if (event.target.classList.contains("line-quantity")) line.quantity = Number(event.target.value); if (event.target.classList.contains("line-price")) line.price = Number(event.target.value); renderLines(); });
document.querySelector("#invoice-form").addEventListener("submit", event => { event.preventDefault(); const invoice = makeInvoiceFromForm(); if (!invoice) return; data.invoices.push(invoice); saveData(); renderAll(); draftLines = [newLine()]; event.currentTarget.reset(); document.querySelector("#invoice-date").value = today(); document.querySelector("#invoice-due-date").value = addDays(today(), data.profile.paymentDays); document.querySelector("#invoice-number-preview").value = "Attribué à l'enregistrement"; renderLines(); showToast(`Facture ${invoice.number} enregistrée.`); openInvoice(invoice); });
document.querySelector("#preview-invoice").addEventListener("click", () => { const invoice = makeInvoiceFromForm(); if (invoice) openInvoice(invoice); });
document.querySelector("#profile-form").addEventListener("submit", event => { event.preventDefault(); data.profile = { ...data.profile, ...Object.fromEntries(new FormData(event.currentTarget)) }; saveData(); renderAll(); document.querySelector("#invoice-due-date").value = addDays(document.querySelector("#invoice-date").value || today(), data.profile.paymentDays); showToast("Informations enregistrées."); });
document.querySelector("[name=vatMode]").addEventListener("change", event => { document.querySelectorAll(".vat-only").forEach(item => item.style.display = event.target.value === "tva" ? "grid" : "none"); });
document.querySelector("#invoice-date").addEventListener("change", event => { document.querySelector("#invoice-due-date").value = addDays(event.target.value, data.profile.paymentDays); });
document.querySelector("#print-invoice").addEventListener("click", () => window.print());

document.querySelector("#invoice-date").value = today(); document.querySelector("#invoice-due-date").value = addDays(today(), data.profile.paymentDays); renderAll();

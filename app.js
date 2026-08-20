const KEY = "alex-coaching-factures-v2";
const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const defaults = { businessName:"Alex Coaching", legalForm:"", businessAddress:"", businessEmail:"alexcoaching00@gmail.com", businessPhone:"07 80 71 58 85", siret:"", vatMode:"franchise", vatRate:"20", paymentDays:"30", paymentTerms:"Paiement à réception de facture." };
let state = read(); let lines = [line()]; let toastDelay;
function id(){return globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`}
function read(){try{const x=JSON.parse(localStorage.getItem(KEY));return {profile:{...defaults,...(x?.profile||{})},clients:x?.clients||[],invoices:x?.invoices||[]}}catch{return {profile:{...defaults},clients:[],invoices:[]}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}function line(){return {id:id(),description:"Séance de coaching",quantity:1,price:0}}function today(){return new Date().toISOString().slice(0,10)}function datePlus(date,days){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+Number(days||0));return d.toISOString().slice(0,10)}function esc(s=""){return String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c])}
function totals(items){const ht=items.reduce((sum,x)=>sum+Number(x.quantity||0)*Number(x.price||0),0);const t=state.profile.vatMode==="tva"?Number(state.profile.vatRate)/100:0;return {ht,vat:ht*t,ttc:ht*(1+t)}}function flash(text){const t=document.querySelector("#toast");t.textContent=text;t.classList.add("show-toast");clearTimeout(toastDelay);toastDelay=setTimeout(()=>t.classList.remove("show-toast"),2600)}
function go(page){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===page));document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.view===page));window.scrollTo({top:0,behavior:"smooth"})}
function fillClients(){const select=document.querySelector("#invoice-client"),saved=select.value;select.innerHTML=`<option value="">Choisir un client…</option>${state.clients.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("")}`;select.value=saved;const list=document.querySelector("#client-list");if(!state.clients.length){list.className="empty";list.textContent="Ton carnet est vide.";return}list.className="";list.innerHTML=state.clients.map(x=>`<article class="client"><div><strong>${esc(x.name)}</strong><small>${esc(x.email||x.address||"Coordonnées à compléter")}</small></div><button class="delete" data-delete-client="${x.id}">Supprimer</button></article>`).join("")}
function refreshTotals(){document.querySelectorAll("#lines tr").forEach(row=>{const x=lines.find(y=>y.id===row.dataset.id);if(x)row.querySelector(".line-total").textContent=money.format(Number(x.quantity||0)*Number(x.price||0))});const t=totals(lines);document.querySelector("#total-ht").textContent=money.format(t.ht);document.querySelector("#total-vat").textContent=money.format(t.vat);document.querySelector("#total-ttc").textContent=money.format(t.ttc);document.querySelector("#vat-row").style.display=state.profile.vatMode==="tva"?"flex":"none"}
function renderLines(){document.querySelector("#lines").innerHTML=lines.map(x=>`<tr data-id="${x.id}"><td><input class="desc" value="${esc(x.description)}" aria-label="Prestation"></td><td><input class="qty" type="number" min="0" step="0.5" value="${x.quantity}" aria-label="Quantité"></td><td><input class="price" type="number" min="0" step="0.01" value="${x.price}" aria-label="Prix unitaire HT"></td><td class="line-total"></td><td><button type="button" class="remove" data-remove="${x.id}">×</button></td></tr>`).join("");refreshTotals()}
function nextNumber(date){const year=date.slice(0,4);return `${year}-${String(state.invoices.filter(x=>x.number.startsWith(`${year}-`)).length+1).padStart(3,"0")}`}
function table(invoices){return `<div class="table-scroll"><table class="history-table"><thead><tr><th>NUMÉRO</th><th>CLIENT</th><th>DATE</th><th>TTC</th><th>STATUT</th><th></th></tr></thead><tbody>${invoices.map(x=>`<tr><td><strong>${x.number}</strong></td><td>${esc(x.clientName)}</td><td>${new Date(`${x.date}T12:00:00`).toLocaleDateString("fr-FR")}</td><td>${money.format(x.ttc)}</td><td><button class="badge ${x.status}" data-status="${x.id}">${x.status==="paid"?"Payée":"Brouillon"}</button></td><td><button class="view-button" data-open="${x.id}">Voir</button></td></tr>`).join("")}</tbody></table></div>`}
function renderSummary(){document.querySelector("#stat-clients").textContent=state.clients.length;document.querySelector("#stat-invoices").textContent=state.invoices.length;document.querySelector("#stat-outstanding").textContent=money.format(state.invoices.filter(x=>x.status!=="paid").reduce((s,x)=>s+x.ttc,0));const recent=state.invoices.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5);document.querySelector("#recent").className=recent.length?"":"empty";document.querySelector("#recent").innerHTML=recent.length?table(recent):"Aucune facture créée pour le moment.";const history=document.querySelector("#history-list");history.className=state.invoices.length?"":"empty";history.innerHTML=state.invoices.length?table(state.invoices.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt))):"Aucune facture enregistrée."}
function renderProfile(){const f=document.querySelector("#profile-form");Object.entries(state.profile).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v});f.querySelectorAll(".vat-field").forEach(x=>x.style.display=state.profile.vatMode==="tva"?"grid":"none");document.querySelector("#legal-alert").style.display=state.profile.siret.trim()?"none":"flex"}
function render(){fillClients();renderLines();renderSummary();renderProfile()}
function collectInvoice(){const client=state.clients.find(x=>x.id===document.querySelector("#invoice-client").value),items=lines.map(x=>({...x,description:x.description.trim()})).filter(x=>x.description&&Number(x.quantity)>0);if(!client){flash("Choisis d’abord un client.");return}if(!items.length){flash("Ajoute une prestation.");return}const date=document.querySelector("#invoice-date").value,due=document.querySelector("#invoice-due").value;if(!date||!due){flash("Ajoute les dates de facture.");return}const t=totals(items);return {id:id(),number:nextNumber(date),clientId:client.id,clientName:client.name,date,due,items,note:document.querySelector("#invoice-note").value.trim(),...t,status:"draft",profile:{...state.profile},createdAt:new Date().toISOString()}}
function paper(invoice){const p=invoice.profile||state.profile,client=state.clients.find(x=>x.id===invoice.clientId)||{name:invoice.clientName,address:""},vat=p.vatMode==="tva"?`TVA ${p.vatRate} %` : "TVA non applicable, art. 293 B du CGI.";return `<div class="paper-header"><div class="paper-brand"><img src="alex-coaching-logo.png" alt="Alex Coaching"><div><h3>${esc(p.businessName)}</h3><p>${esc(p.legalForm)}<br>${esc(p.businessAddress)}<br>${esc(p.businessEmail)}${p.businessPhone?`<br>${esc(p.businessPhone)}`:""}</p></div></div><div><h4>FACTURE</h4><small>N° ${invoice.number}<br>Émise le ${new Date(`${invoice.date}T12:00:00`).toLocaleDateString("fr-FR")}</small></div></div><div class="paper-parties"><div><p class="paper-label">FACTURÉ À</p><p><strong>${esc(client.name)}</strong><br>${esc(client.address||"Adresse à compléter")}</p></div><div><p class="paper-label">RÈGLEMENT</p><p>Échéance : ${new Date(`${invoice.due}T12:00:00`).toLocaleDateString("fr-FR")}<br>${vat}</p></div></div><table><thead><tr><th>PRESTATION</th><th>QTÉ</th><th>PRIX UNIT. HT</th><th class="right">TOTAL HT</th></tr></thead><tbody>${invoice.items.map(x=>`<tr><td>${esc(x.description)}</td><td>${x.quantity}</td><td>${money.format(x.price)}</td><td class="right">${money.format(x.quantity*x.price)}</td></tr>`).join("")}</tbody></table><div class="paper-sums"><p><span>Total HT</span><strong>${money.format(invoice.ht)}</strong></p>${p.vatMode==="tva"?`<p><span>TVA</span><strong>${money.format(invoice.vat)}</strong></p>`:""}<p class="grand"><span>TOTAL TTC</span><strong>${money.format(invoice.ttc)}</strong></p></div>${invoice.note?`<p><strong>Note</strong><br>${esc(invoice.note)}</p>`:""}<p class="paper-footer">${esc(p.paymentTerms)}<br><br>SIRET : ${esc(p.siret||"À compléter avant émission")}</p>`}
function open(invoice){document.querySelector("#paper").innerHTML=paper(invoice);document.querySelector("#modal").classList.add("open")}function close(){document.querySelector("#modal").classList.remove("open")}
document.querySelectorAll("[data-view]").forEach(x=>x.addEventListener("click",e=>{e.preventDefault();go(x.dataset.view)}));document.addEventListener("click",e=>{const g=e.target.closest("[data-go]");if(g)go(g.dataset.go);if(e.target.closest("[data-close]"))close();const del=e.target.closest("[data-delete-client]");if(del){if(state.invoices.some(x=>x.clientId===del.dataset.deleteClient)){flash("Ce client est lié à une facture.");return}state.clients=state.clients.filter(x=>x.id!==del.dataset.deleteClient);save();render();flash("Client supprimé.")}const remove=e.target.closest("[data-remove]");if(remove){if(lines.length===1){flash("Une facture doit avoir au moins une ligne.");return}lines=lines.filter(x=>x.id!==remove.dataset.remove);renderLines()}const openBtn=e.target.closest("[data-open]");if(openBtn)open(state.invoices.find(x=>x.id===openBtn.dataset.open));const status=e.target.closest("[data-status]");if(status){const x=state.invoices.find(y=>y.id===status.dataset.status);x.status=x.status==="paid"?"draft":"paid";save();renderSummary()}});
document.querySelector("#client-form").addEventListener("submit",e=>{e.preventDefault();state.clients.push({id:id(),...Object.fromEntries(new FormData(e.currentTarget))});save();e.currentTarget.reset();render();flash("Client enregistré.")});document.querySelector("#add-line").addEventListener("click",()=>{lines.push(line());renderLines()});document.querySelector("#lines").addEventListener("input",e=>{const row=e.target.closest("tr"),x=lines.find(y=>y.id===row?.dataset.id);if(!x)return;if(e.target.classList.contains("desc"))x.description=e.target.value;if(e.target.classList.contains("qty"))x.quantity=Number(e.target.value);if(e.target.classList.contains("price"))x.price=Number(e.target.value);refreshTotals()});
function showSend(msg){const o=document.querySelector("#sendOverlay"),b=o.querySelector(".send-box");b.className="send-box";document.querySelector("#sendStatus").textContent=msg;o.classList.add("open")}
function sendState(state,msg){const b=document.querySelector("#sendOverlay .send-box");b.className="send-box "+state;document.querySelector("#sendStatus").textContent=msg}
function hideSendLater(ms){setTimeout(()=>document.querySelector("#sendOverlay").classList.remove("open"),ms)}

async function pdfFileFromNode(node, filename){
  if (typeof html2canvas === "undefined") throw new Error("html2canvas non chargé (bloqueur de pub ou CDN inaccessible)");
  if (typeof window.jspdf === "undefined") throw new Error("jsPDF non chargé (bloqueur de pub ou CDN inaccessible)");
  const canvas = await html2canvas(node,{scale:2,backgroundColor:"#fffaf4"});
  const img = canvas.toDataURL("image/jpeg",0.95);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({unit:"mm",format:"a4"});
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageW/canvas.width, pageH/canvas.height);
  const w = canvas.width*ratio, h = canvas.height*ratio;
  pdf.addImage(img,"JPEG",(pageW-w)/2,10,w,Math.min(h,pageH-20));
  const blob = pdf.output("blob");
  return new File([blob], filename, { type: "application/pdf" });
}

async function emailInvoice(invoice){
  const client = state.clients.find(x=>x.id===invoice.clientId);
  if(!client?.email){ sendState("error","Ce client n'a pas d'adresse email."); hideSendLater(3200); return; }

  showSend("Génération du PDF…");
  const captureBox = document.createElement("div");
  captureBox.style.cssText = "position:fixed; left:-9999px; top:0; width:794px; background:#fffaf4;";
  captureBox.className = "paper";
  captureBox.innerHTML = paper(invoice);
  document.body.appendChild(captureBox);
  const logoImg = captureBox.querySelector("img");
  await new Promise(resolve=>{
    if(!logoImg || logoImg.complete){ resolve(); return; }
    logoImg.addEventListener("load",resolve,{once:true});
    logoImg.addEventListener("error",()=>{logoImg.style.display="none"; resolve();},{once:true});
    setTimeout(resolve,1500); // filet de sécurité si l'image ne répond jamais
  });
  let pdfFile;
  try{
    pdfFile = await pdfFileFromNode(captureBox, `facture-${invoice.number}.pdf`);
  }catch(err){
    console.error("Erreur génération PDF:", err);
    captureBox.remove();
    sendState("error","PDF impossible : "+(err.message||"vérifie ta connexion et réessaie."));
    hideSendLater(4500);
    return;
  }
  captureBox.remove();

  // Téléchargement automatique du PDF
  const dlLink = document.createElement("a");
  dlLink.href = URL.createObjectURL(pdfFile);
  dlLink.download = pdfFile.name;
  document.body.appendChild(dlLink);
  dlLink.click();
  dlLink.remove();

  // Sauvegarde de la facture dans l'historique
  state.invoices.push({...invoice,status:"draft"});
  save();
  renderSummary();

  // Ouverture du mail pré-rempli, PDF déjà téléchargé prêt à glisser
  const subject = encodeURIComponent(`Facture ${invoice.number} — ${state.profile.businessName || "Alex Coaching"}`);
  const body = encodeURIComponent(
    `Bonjour ${client.name},\n\n`+
    `Voici ta facture ${invoice.number} d'un montant de ${money.format(invoice.ttc)}.\n\n`+
    `Le PDF vient d'être téléchargé sur ton ordinateur — pense à le glisser dans ce mail avant de l'envoyer.\n\n`+
    (invoice.note ? invoice.note+"\n\n" : "")+
    `Merci de ta confiance.\n${state.profile.businessName || "Alex Coaching"}`
  );
  window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;

  sendState("success","PDF téléchargé — n'oublie pas de le joindre dans le mail qui s'ouvre ✓");
  flash(`Facture ${invoice.number} générée.`);
  lines=[line()];
  document.querySelector("#invoice-form").reset();
  document.querySelector("#invoice-date").value=today();
  document.querySelector("#invoice-due").value=datePlus(today(),state.profile.paymentDays);
  renderLines();
  hideSendLater(3200);
}

document.querySelector("#invoice-form").addEventListener("submit",e=>{
  e.preventDefault();
  const x=collectInvoice();
  if(!x)return;
  emailInvoice(x);
});
document.querySelector("#preview").addEventListener("click",()=>{const x=collectInvoice();if(x)open(x)});document.querySelector("#profile-form").addEventListener("submit",e=>{e.preventDefault();state.profile={...state.profile,...Object.fromEntries(new FormData(e.currentTarget))};save();render();document.querySelector("#invoice-due").value=datePlus(document.querySelector("#invoice-date").value||today(),state.profile.paymentDays);flash("Informations enregistrées.")});document.querySelector("[name=vatMode]").addEventListener("change",e=>document.querySelectorAll(".vat-field").forEach(x=>x.style.display=e.target.value==="tva"?"grid":"none"));document.querySelector("#invoice-date").addEventListener("change",e=>document.querySelector("#invoice-due").value=datePlus(e.target.value,state.profile.paymentDays));document.querySelector("#print").addEventListener("click",()=>window.print());
document.querySelector("#invoice-date").value=today();document.querySelector("#invoice-due").value=datePlus(today(),state.profile.paymentDays);render();

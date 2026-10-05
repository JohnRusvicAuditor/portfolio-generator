import './style.css';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const db = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = s => document.querySelector(s), M = $("#main");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let flash = null, photo = "";
const note = (m, err) => flash = {m, err};
const banner = () => { if (!flash) return ""; const f = flash; flash = null;
  return `<div class="alert ${f.err ? "err" : ""}">${esc(f.m)}<span onclick="this.parentNode.remove()">×</span></div>`; };

const ROWS = {
  education: [["school","School / University"],["degree","Degree / Course"],["years","Years (e.g. 2020-2024)"]],
  projects: [["title","Project title"],["description","Description"],["link","Link (optional)"]],
  experience: [["company","Company"],["role","Role"],["years","Years"],["description","Description"]],
  links: [["label","Label (e.g. GitHub)"],["url","https://..."]]
};
const rowHTML = (t, v = {}) => `<div class="row" data-t="${t}"><div class="g">${ROWS[t].map(([k, p]) =>
  `<input data-k="${k}" placeholder="${p}" value="${esc(v[k])}">`).join("")}</div>
  <a href="#" onclick="this.parentNode.remove();return false">Remove</a></div>`;
window.addRow = t => $("#list-" + t).insertAdjacentHTML("beforeend", rowHTML(t));

async function getAll() {
  const { data, error } = await db.from("portfolios").select("*").order("created_at", { ascending: false });
  if (error) throw error; return data;
}
async function getOne(id) {
  const { data, error } = await db.from("portfolios").select("*").eq("id", id).single();
  if (error) throw error; return data;
}

// ---------- Pages ----------
const home = () => `<div class="card hero"><h1>Build your portfolio in minutes</h1>
<p>Enter your details once, save them to the cloud, pick one of three designs and share your portfolio.</p>
<a class="btn" href="#/form">Create Portfolio</a> <a class="btn o" href="#/manage">Manage Portfolios</a></div>
<div class="feat"><div class="card"><b>1</b><h2>Enter info</h2>Fill in your profile, skills, projects and experience.</div>
<div class="card"><b>2</b><h2>Save online</h2>Your data is stored safely in a cloud database.</div>
<div class="card"><b>3</b><h2>Pick a template</h2>Simple, Modern or Creative, then preview instantly.</div></div>`;

async function formPage(id) {
  const p = id ? await getOne(id) : { education: [], skills: [], projects: [], experience: [], links: [] };
  photo = p.photo || "";
  const sec = (t, title) => `<div class="card"><h2>${title}</h2><div id="list-${t}">${(p[t] || []).map(v => rowHTML(t, v)).join("")}</div>
    <button type="button" class="btn o" onclick="addRow('${t}')">+ Add</button></div>`;
  return `${banner()}<h1>${id ? "Edit" : "Create"} Portfolio</h1>
<form id="f" onsubmit="return save(event,'${id || ""}')">
<div class="card"><h2>Personal Information</h2>
<div class="g"><div><label>Full Name *</label><input name="full_name" required value="${esc(p.full_name)}"></div>
<div><label>Email</label><input name="email" type="email" value="${esc(p.email)}"></div>
<div><label>Contact Number</label><input name="contact_number" value="${esc(p.contact_number)}"></div>
<div><label>Address</label><input name="address" value="${esc(p.address)}"></div></div>
<label>Profile Picture</label><input type="file" accept="image/*" onchange="pickPhoto(this)">
<img id="pv" src="${esc(photo)}" style="width:90px;height:90px;object-fit:cover;border-radius:50%;margin-top:8px;${photo ? "" : "display:none"}">
<label>About Me</label><textarea name="about" rows="4">${esc(p.about)}</textarea></div>
${sec("education", "Educational Background")}
<div class="card"><h2>Skills</h2><input name="skills" placeholder="Comma-separated, e.g. HTML, CSS, JavaScript" value="${esc((p.skills || []).join(", "))}"></div>
${sec("projects", "Projects")}${sec("experience", "Work Experience")}${sec("links", "Social Media / Website Links")}
<button class="btn" id="sv">Save &amp; Choose Template</button> <a class="btn o" href="#/manage">Cancel</a></form>`;
}
window.pickPhoto = inp => {
  const f = inp.files[0]; if (!f) return; const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => {
    const s = Math.min(1, 400 / Math.max(im.width, im.height)), c = document.createElement("canvas");
    c.width = im.width * s; c.height = im.height * s; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    photo = c.toDataURL("image/jpeg", .8); const pv = $("#pv"); pv.src = photo; pv.style.display = "block"; };
    im.src = r.result; };
  r.readAsDataURL(f);
};
window.save = async (e, id) => {
  e.preventDefault(); const fd = new FormData($("#f")); $("#sv").disabled = true;
  const rows = t => [...document.querySelectorAll(`.row[data-t="${t}"]`)].map(r =>
    Object.fromEntries([...r.querySelectorAll("input")].map(i => [i.dataset.k, i.value.trim()]))).filter(o => Object.values(o).some(Boolean));
  const rec = { full_name: fd.get("full_name").trim(), email: fd.get("email"), contact_number: fd.get("contact_number"),
    address: fd.get("address"), about: fd.get("about"), photo,
    skills: fd.get("skills").split(",").map(s => s.trim()).filter(Boolean),
    education: rows("education"), projects: rows("projects"), experience: rows("experience"), links: rows("links"),
    updated_at: new Date().toISOString() };
  const q = id ? db.from("portfolios").update(rec).eq("id", id).select().single() : db.from("portfolios").insert(rec).select().single();
  const { data, error } = await q;
  if (error) { note("Save failed: " + error.message, true); $("#sv").disabled = false; return route(); }
  note("Changes saved"); location.hash = "#/templates/" + data.id; return false;
};

const mini = n => ({
  1: `<div style="margin:auto;text-align:center;font-family:Georgia"><div style="width:34px;height:34px;border-radius:50%;background:#bbb;margin:auto"></div><hr style="width:120px;border-color:#222"><small>NAME</small></div>`,
  2: `<div style="width:100%"><div style="height:50px;background:linear-gradient(135deg,#4f46e5,#06b6d4)"></div><div style="display:flex;gap:6px;padding:8px;background:#eef2ff;height:100px"><i style="flex:1;background:#fff;border-radius:8px"></i><i style="flex:1;background:#fff;border-radius:8px"></i></div></div>`,
  3: `<div style="display:flex;width:100%;background:#111"><i style="width:35%;background:#ff5e5b"></i><b style="color:#ffd166;padding:10px;font-size:22px">ABOUT</b></div>`
})[n];

async function templatesPage(id) {
  const p = await getOne(id), names = ["Simple", "Modern", "Creative"], d = ["Clean and professional single column.", "Cards, sections and colour accents.", "Bold split layout with big type."];
  return `${banner()}<h1>Select a Template</h1><p>Portfolio for <b>${esc(p.full_name)}</b></p><div class="tg">${[1, 2, 3].map(n =>
    `<div class="card"><div class="thumb">${mini(n)}</div><h2>Template ${n} – ${names[n - 1]}</h2><p>${d[n - 1]}</p>
    <button class="btn" onclick="pick('${id}',${n})">${p.template === n ? "✓ Use this (current)" : "Use this template"}</button></div>`).join("")}</div>`;
}
window.pick = async (id, n) => {
  const { error } = await db.from("portfolios").update({ template: n }).eq("id", id);
  if (error) { note("Could not save template: " + error.message, true); return route(); }
  note("Portfolio generated"); location.hash = "#/preview/" + id;
};

const lines = (a, f) => (a || []).map(f).join("");
const lk = l => l.url ? `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || l.url)}</a>` : "";
const contact = p => [p.email, p.contact_number, p.address].filter(Boolean).map(esc).join(" · ");
const T = {
  1: p => `<div class="t1"><header>${p.photo ? `<img src="${esc(p.photo)}">` : ""}<h1>${esc(p.full_name)}</h1><div>${contact(p)}</div></header>
    ${p.about ? `<h3>About Me</h3><p>${esc(p.about)}</p>` : ""}
    ${p.education?.length ? `<h3>Education</h3>` + lines(p.education, e => `<p><b>${esc(e.school)}</b> — ${esc(e.degree)} <i>${esc(e.years)}</i></p>`) : ""}
    ${p.experience?.length ? `<h3>Experience</h3>` + lines(p.experience, e => `<p><b>${esc(e.role)}</b>, ${esc(e.company)} <i>${esc(e.years)}</i><br>${esc(e.description)}</p>`) : ""}
    ${p.skills?.length ? `<h3>Skills</h3><p>${p.skills.map(esc).join(" • ")}</p>` : ""}
    ${p.projects?.length ? `<h3>Projects</h3>` + lines(p.projects, e => `<p><b>${esc(e.title)}</b> ${e.link ? `(${lk({ url: e.link, label: "link" })})` : ""}<br>${esc(e.description)}</p>`) : ""}
    ${p.links?.length ? `<h3>Links</h3><p>${p.links.map(lk).join(" | ")}</p>` : ""}</div>`,
  2: p => `<div class="t2"><header>${p.photo ? `<img src="${esc(p.photo)}">` : ""}<div><h1>${esc(p.full_name)}</h1><div>${contact(p)}</div></div></header><div class="cg">
    ${p.about ? `<div class="c"><h3>About Me</h3>${esc(p.about)}</div>` : ""}
    ${p.skills?.length ? `<div class="c"><h3>Skills</h3>${p.skills.map(s => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
    ${p.education?.length ? `<div class="c"><h3>Education</h3>${lines(p.education, e => `<p><b>${esc(e.school)}</b><br>${esc(e.degree)} · ${esc(e.years)}</p>`)}</div>` : ""}
    ${p.experience?.length ? `<div class="c"><h3>Experience</h3>${lines(p.experience, e => `<p><b>${esc(e.role)}</b> @ ${esc(e.company)}<br><small>${esc(e.years)}</small><br>${esc(e.description)}</p>`)}</div>` : ""}
    ${lines(p.projects, e => `<div class="c"><h3>${esc(e.title)}</h3>${esc(e.description)}<br>${e.link ? lk({ url: e.link, label: "View project" }) : ""}</div>`)}
    ${p.links?.length ? `<div class="c"><h3>Links</h3>${p.links.map(lk).join("<br>")}</div>` : ""}</div></div>`,
  3: p => `<div class="t3"><aside>${p.photo ? `<img src="${esc(p.photo)}">` : ""}<h1>${esc(p.full_name)}</h1><p>${[p.email, p.contact_number, p.address].filter(Boolean).map(esc).join("<br>")}</p>
    <p>${(p.links || []).map(lk).join("<br>")}</p></aside><section>
    ${p.about ? `<h3>Hello</h3><p>${esc(p.about)}</p>` : ""}
    ${p.skills?.length ? `<h3>Skills</h3><p>${p.skills.map(s => `<span class="chip" style="background:#ff5e5b;color:#111">${esc(s)}</span>`).join("")}</p>` : ""}
    ${p.projects?.length ? `<h3>Projects</h3>` + lines(p.projects, e => `<div class="it"><b>${esc(e.title)}</b><br>${esc(e.description)} ${e.link ? lk({ url: e.link, label: "↗" }) : ""}</div>`) : ""}
    ${p.experience?.length ? `<h3>Work</h3>` + lines(p.experience, e => `<div class="it"><b>${esc(e.role)}</b> — ${esc(e.company)} (${esc(e.years)})<br>${esc(e.description)}</div>`) : ""}
    ${p.education?.length ? `<h3>Study</h3>` + lines(p.education, e => `<div class="it"><b>${esc(e.school)}</b><br>${esc(e.degree)} (${esc(e.years)})</div>`) : ""}</section></div>`
};
async function previewPage(id) {
  const p = await getOne(id);
  return `${banner()}<div class="bar"><a class="btn o" href="#/templates/${id}">Change Template</a><a class="btn o" href="#/form/${id}">Edit</a><a class="btn o" href="#/manage">Manage</a></div>${T[p.template](p)}`;
}
async function managePage() {
  const all = await getAll();
  return `${banner()}<h1>Manage Portfolios</h1><div class="card">${all.length ? `<div style="overflow-x:auto"><table><tr><th>Name</th><th>Email</th><th>Template</th><th>Actions</th></tr>${all.map(p =>
    `<tr><td>${esc(p.full_name)}</td><td>${esc(p.email)}</td><td>${p.template}</td><td>
    <a href="#/preview/${p.id}">View</a> · <a href="#/form/${p.id}">Edit</a> · <a href="#/templates/${p.id}">Template</a> · <a href="#" style="color:#c0392b" onclick="del('${p.id}');return false">Delete</a></td></tr>`).join("")}</table></div>`
    : `<p>No portfolios yet.</p><a class="btn" href="#/form">Create Portfolio</a>`}</div>`;
}
window.del = async id => {
  if (!confirm("Delete this portfolio permanently?")) return;
  const { error } = await db.from("portfolios").delete().eq("id", id);
  note(error ? "Delete failed: " + error.message : "Portfolio deleted", !!error); route();
};

// ---------- Router ----------
async function route() {
  document.body.classList.remove("open");
  const [, r = "", id] = location.hash.slice(1).split("/");
  document.querySelectorAll("#top nav a").forEach(a => a.classList.toggle("on", a.dataset.r === (r || "home") || (r === "" && a.dataset.r === "home")));
  if (!configured && r !== "") { M.innerHTML = `<div class="alert err">Database not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README).</div>`; return; }
  M.innerHTML = "<p>Loading…</p>";
  try {
    M.innerHTML = r === "form" ? await formPage(id) : r === "templates" ? await templatesPage(id) :
      r === "preview" ? await previewPage(id) : r === "manage" ? await managePage() : home();
  } catch (e) {
    M.innerHTML = `<div class="alert err">Error: ${esc(e.message)}. Check your Supabase URL, key and table setup.</div><a class="btn o" href="#/">Home</a>`;
  }
  window.scrollTo(0, 0);
}
addEventListener("hashchange", route); route();

import { supabase } from "/supabase-client.js";

const defaultCakes = [
  { name: "Strawberry wish", price: 42, category: "Seasonal", description: "Vanilla sponge, strawberry compote, and a cloud of cream.", image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85" },
  { name: "Midnight chocolate", price: 38, category: "Classic", description: "Deep cocoa layers, salted caramel, and glossy ganache.", image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85" },
  { name: "Lemon bloom", price: 36, category: "Classic", description: "Bright lemon curd, soft sponge, and sugared petals.", image_url: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=900&q=85" },
  { name: "Velvet number", price: 45, category: "Celebration", description: "Red velvet, whipped cream cheese, and a little drama.", image_url: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=900&q=85" },
  { name: "Pistachio picnic", price: 40, category: "Seasonal", description: "Roasted pistachio, raspberry jam, and tender olive oil cake.", image_url: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=900&q=85" },
  { name: "Party cake", price: 48, category: "Celebration", description: "Vanilla funfetti, buttercream swirls, and extra sprinkles.", image_url: "https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=900&q=85" }
];
const defaultStory = [
  { icon: "✦", time_label: "2019", title: "A little kitchen", description: "Where a love for soft sponge, bright fruit, and generous frosting first began.", sort_order: 0 },
  { icon: "✿", time_label: "2021", title: "More reasons to celebrate", description: "Word spread, orders grew, and every cake became part of someone’s sweetest day.", sort_order: 1 },
  { icon: "♡", time_label: "Today", title: "Made with intention", description: "Small-batch bakes, carefully finished and made to feel like they belong to your people.", sort_order: 2 },
  { icon: "✦", time_label: "And then...", title: "Happily ever after", description: "There is always room for one more slice.", sort_order: 3 }
];
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) {
    document.body.classList.add("admin-view");
    if (window.top !== window.self) {
      setTimeout(() => document.querySelector("#admin").scrollIntoView(), 100);
    }
  }
});
const grid = document.querySelector("#cake-grid");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const filterGroup = document.querySelector(".filter-group");
const categorySelect = document.querySelector("#category-select");
const dialog = document.querySelector("#cake-dialog");
const form = document.querySelector("#cake-form");
const categoryDialog = document.querySelector("#category-dialog");
const categoryForm = document.querySelector("#category-form");
const confirmDialog = document.querySelector("#confirm-dialog");
const confirmForm = document.querySelector("#confirm-form");
const storyDialog = document.querySelector("#story-dialog");
const storyForm = document.querySelector("#story-form");
const storyFields = document.querySelector("#story-fields");
const imageUpload = document.querySelector("#photo-upload");
const imageFileName = document.querySelector("#image-file-name");
const testimonialImageUpload = document.querySelector("#testimonial-photo-upload");
const testimonialImageFileName = document.querySelector("#testimonial-image-file-name");
const adminList = document.querySelector("#admin-list");
const testimonialTrack = document.querySelector("#testimonial-track");
const testimonialAdminList = document.querySelector("#testimonial-admin-list");
const testimonialDialog = document.querySelector("#testimonial-dialog");
const testimonialForm = document.querySelector("#testimonial-form");
let cakes = [];
let savedCategories = [];
let story = [];
let testimonials = [];
let selectedFilter = "All";
let editingId = null;
let editingCategory = null;
let editingTestimonialId = null;
let storyDraft = null;
let confirmResolution = null;

function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]); }
function imageUrl(cake) { return cake.image_url || ""; }
function reportError(error) { console.error(error); window.alert(error.message || String(error)); }

async function loadData() {
  const [cakesResult, categoriesResult, storyResult, testimonialsResult] = await Promise.all([
    supabase.from("cakes").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("name").order("name"),
    supabase.from("milestones").select("*").order("sort_order"),
    supabase.from("testimonials").select("*").order("created_at")
  ]);
  if (cakesResult.error || categoriesResult.error || storyResult.error || (testimonialsResult && testimonialsResult.error)) {
    reportError(cakesResult.error || categoriesResult.error || storyResult.error || testimonialsResult.error);
    cakes = defaultCakes;
    savedCategories = ["Classic", "Seasonal", "Celebration"];
    story = defaultStory;
    testimonials = [];
    return;
  }
  cakes = cakesResult.data?.length ? cakesResult.data : defaultCakes;
  savedCategories = categoriesResult.data?.map((item) => item.name) || [];
  story = storyResult.data?.length ? storyResult.data : defaultStory;
  testimonials = testimonialsResult.data || [];
}
function renderCakes() {
  const categories = [...new Set([...savedCategories, ...cakes.map((cake) => cake.category)].filter(Boolean))].sort();
  if (selectedFilter !== "All" && !categories.includes(selectedFilter)) selectedFilter = "All";
  filterGroup.innerHTML = [`<button class="filter ${selectedFilter === "All" ? "active" : ""}" data-filter="All" type="button">All</button>`, ...categories.map((category) => `<span class="category-filter-item"><button class="filter ${selectedFilter === category ? "active" : ""}" data-filter="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button><button class="edit-category" data-category="${escapeHtml(category)}" type="button" aria-label="Edit ${escapeHtml(category)} category">✎</button><button class="delete-category" data-category="${escapeHtml(category)}" type="button" aria-label="Delete ${escapeHtml(category)} category">×</button></span>`), `<button class="add-category-filter" id="add-category-filter" type="button">+ Add category</button>`].join("");
  categorySelect.innerHTML = categories.length ? categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("") : `<option value="" disabled selected>Add a category first</option>`;
  const search = searchInput.value.trim().toLowerCase();
  const visibleCakes = cakes.filter((cake) => (selectedFilter === "All" || cake.category === selectedFilter) && `${cake.name} ${cake.description || ""} ${cake.category}`.toLowerCase().includes(search));
  grid.innerHTML = visibleCakes.map((cake, index) => `<article class="cake-card" style="animation-delay: ${index * 60}ms"><div class="cake-photo"><img src="${escapeHtml(imageUrl(cake))}" alt="${escapeHtml(cake.name)} cake" loading="lazy" /><span class="category">${escapeHtml(cake.category)}</span></div><div class="cake-info"><div><h3>${escapeHtml(cake.name)}</h3><p>${escapeHtml(cake.description)}</p></div><strong class="price">₱${Number(cake.price).toFixed(2)}</strong></div></article>`).join("");
  emptyState.hidden = visibleCakes.length !== 0;
  grid.hidden = visibleCakes.length === 0;
  adminList.innerHTML = cakes.map((cake) => `<tr><td><strong>${escapeHtml(cake.name)}</strong><small>${escapeHtml(cake.description)}</small></td><td><span class="table-category">${escapeHtml(cake.category)}</span></td><td class="table-price">₱${Number(cake.price).toFixed(2)}</td><td class="table-actions"><button class="edit-cake" data-id="${escapeHtml(cake.id)}" type="button">Edit</button><button class="delete-cake" data-id="${escapeHtml(cake.id)}" type="button">Delete</button></td></tr>`).join("");
}
function renderStory() { document.querySelector("#story-timeline").innerHTML = story.map((item, index) => `<article class="story-milestone ${index % 2 ? "milestone-right" : "milestone-left"} ${index === story.length - 1 ? "milestone-final" : ""}"><div class="milestone-icon">${escapeHtml(item.icon)}</div><div><time>${escapeHtml(item.time_label)}</time><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p></div></article>`).join(""); }
function renderStoryFields() { storyFields.innerHTML = storyDraft.map((item, index) => `<fieldset><legend>Milestone ${index + 1}</legend><div class="form-row"><label>Year or label<input name="time-${index}" required value="${escapeHtml(item.time_label)}" /></label><label>Icon<input name="icon-${index}" required maxlength="2" value="${escapeHtml(item.icon)}" /></label></div><label>Title<input name="title-${index}" required value="${escapeHtml(item.title)}" /></label><label>Description<textarea name="description-${index}" required maxlength="150" rows="2">${escapeHtml(item.description)}</textarea></label></fieldset>`).join(""); }
function renderTestimonials() {
  if (!testimonials.length) {
    testimonialTrack.innerHTML = '';
    testimonialAdminList.innerHTML = '';
    return;
  }
  const cardsHtml = testimonials.map(t => `<div class="testimonial-card"><p>"${escapeHtml(t.content)}"</p><div class="testimonial-author">${t.avatar_url ? `<img src="${escapeHtml(t.avatar_url)}" alt="${escapeHtml(t.author_name)}" class="testimonial-avatar" />` : ''}— ${escapeHtml(t.author_name)}</div></div>`).join("");
  testimonialTrack.innerHTML = cardsHtml + cardsHtml;
  testimonialAdminList.innerHTML = testimonials.map(t => `<tr><td><strong>${escapeHtml(t.author_name)}</strong></td><td><small>${escapeHtml(t.content)}</small></td><td class="table-actions"><button class="edit-testimonial" data-id="${escapeHtml(t.id)}" type="button">Edit</button><button class="delete-testimonial" data-id="${escapeHtml(t.id)}" type="button">Delete</button></td></tr>`).join("");
}
function showConfirmation(message) { document.querySelector("#confirm-message").textContent = message; confirmDialog.showModal(); return new Promise((resolve) => { confirmResolution = resolve; }); }
function closeConfirmation(result) { confirmResolution?.(result); confirmResolution = null; confirmDialog.close(); }
function openDialog(cake = null) { editingId = cake?.id || null; document.querySelector("#dialog-title").innerHTML = editingId ? "Edit a <em>cake</em>" : "Add a <em>new cake</em>"; document.querySelector("#submit-cake").innerHTML = editingId ? "Save changes <span>✦</span>" : "Add to menu <span>✦</span>"; if (cake) { form.elements.name.value = cake.name; form.elements.price.value = cake.price; form.elements.category.value = cake.category; form.elements.description.value = cake.description || ""; } dialog.showModal(); form.elements.name.focus(); }
function openTestimonialDialog(t = null) { editingTestimonialId = t?.id || null; document.querySelector("#testimonial-dialog-title").innerHTML = editingTestimonialId ? "Edit a <em>testimonial</em>" : "Add a <em>testimonial</em>"; document.querySelector("#submit-testimonial").innerHTML = editingTestimonialId ? "Save changes <span>✦</span>" : "Save testimonial <span>✦</span>"; if (t) { testimonialForm.elements.author_name.value = t.author_name; testimonialForm.elements.content.value = t.content; } else { testimonialForm.reset(); } testimonialImageFileName.textContent = "No file chosen"; testimonialDialog.showModal(); testimonialForm.elements.author_name.focus(); }
function uploadImage(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = async () => { const extension = file.name.split(".").pop().toLowerCase(); const path = `${crypto.randomUUID()}.${extension}`; const { error } = await supabase.storage.from("cake-images").upload(path, file, { contentType: file.type }); if (error) return reject(error); resolve(supabase.storage.from("cake-images").getPublicUrl(path).data.publicUrl); }; reader.onerror = reject; reader.readAsArrayBuffer(file); }); }

document.querySelector("#open-add-admin").addEventListener("click", () => openDialog());
document.querySelector("#open-add-testimonial").addEventListener("click", () => openTestimonialDialog());
document.querySelector("#close-testimonial-dialog").addEventListener("click", () => testimonialDialog.close());
document.querySelector("#cancel-testimonial-dialog").addEventListener("click", () => testimonialDialog.close());
document.querySelector("#open-story-editor").addEventListener("click", () => { storyDraft = story.map((item) => ({ ...item })); renderStoryFields(); storyDialog.showModal(); });
document.querySelector("#add-milestone").addEventListener("click", () => { storyDraft.push({ icon: "✦", time_label: "New", title: "A new sweet chapter", description: "Tell your visitors about this moment in the Sweet Rea's Cake story." }); renderStoryFields(); });
document.querySelector("#close-story-dialog").addEventListener("click", () => { storyDraft = null; storyDialog.close(); });
document.querySelector("#cancel-story-dialog").addEventListener("click", () => { storyDraft = null; storyDialog.close(); });
storyForm.addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(storyForm); const updated = storyDraft.map((item, index) => ({ icon: data.get(`icon-${index}`), time_label: data.get(`time-${index}`), title: data.get(`title-${index}`), description: data.get(`description-${index}`), sort_order: index })); const { error } = await supabase.from("milestones").delete().neq("id", "00000000-0000-0000-0000-000000000000"); if (error) return reportError(error); const insert = await supabase.from("milestones").insert(updated); if (insert.error) return reportError(insert.error); story = updated; storyDraft = null; storyDialog.close(); renderStory(); });
imageUpload.addEventListener("change", () => { imageFileName.textContent = imageUpload.files[0]?.name || "No file chosen"; });
testimonialImageUpload.addEventListener("change", () => { testimonialImageFileName.textContent = testimonialImageUpload.files[0]?.name || "No file chosen"; });
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());
searchInput.addEventListener("input", renderCakes);
filterGroup.addEventListener("click", async (event) => { const button = event.target.closest(".filter"); const editButton = event.target.closest(".edit-category"); const deleteButton = event.target.closest(".delete-category"); if (editButton) { editingCategory = editButton.dataset.category; document.querySelector("#category-dialog-title").innerHTML = "Edit a <em>category</em>"; document.querySelector("#submit-category").innerHTML = "Save changes <span>✦</span>"; categoryForm.elements.category.value = editingCategory; categoryDialog.showModal(); return; } if (deleteButton) { const category = deleteButton.dataset.category; if (await showConfirmation(`Delete ${category} category?`)) { const { error } = await supabase.from("categories").delete().eq("name", category); if (error) return reportError(error); savedCategories = savedCategories.filter((item) => item !== category); renderCakes(); } return; } if (event.target.closest("#add-category-filter")) { editingCategory = null; categoryForm.reset(); document.querySelector("#category-dialog-title").innerHTML = "Add a <em>category</em>"; document.querySelector("#submit-category").innerHTML = "Add category <span>✦</span>"; categoryDialog.showModal(); return; } if (button) { selectedFilter = button.dataset.filter; renderCakes(); } });
document.querySelector("#close-confirm-dialog").addEventListener("click", () => closeConfirmation(false));
document.querySelector("#cancel-confirm-dialog").addEventListener("click", () => closeConfirmation(false));
confirmForm.addEventListener("submit", (event) => { event.preventDefault(); closeConfirmation(true); });
document.querySelector("#close-category-dialog").addEventListener("click", () => categoryDialog.close());
document.querySelector("#cancel-category-dialog").addEventListener("click", () => categoryDialog.close());
categoryForm.addEventListener("submit", async (event) => { event.preventDefault(); const newCategory = categoryForm.elements.category.value.trim(); if (!newCategory) return; const result = editingCategory ? await supabase.from("categories").update({ name: newCategory }).eq("name", editingCategory) : await supabase.from("categories").insert({ name: newCategory }); if (result.error) return reportError(result.error); savedCategories = [...new Set([...savedCategories.filter((item) => item !== editingCategory), newCategory])]; categoryDialog.close(); renderCakes(); });
adminList.addEventListener("click", async (event) => { const button = event.target.closest("button"); if (!button) return; const cake = cakes.find((item) => item.id === button.dataset.id); if (!cake) return; if (button.classList.contains("edit-cake")) return openDialog(cake); if (button.classList.contains("delete-cake") && await showConfirmation(`Delete ${cake.name} from the menu?`)) { const { error } = await supabase.from("cakes").delete().eq("id", cake.id); if (error) return reportError(error); cakes = cakes.filter((item) => item.id !== cake.id); renderCakes(); } });
testimonialAdminList.addEventListener("click", async (event) => { const button = event.target.closest("button"); if (!button) return; const t = testimonials.find((item) => item.id === button.dataset.id); if (!t) return; if (button.classList.contains("edit-testimonial")) return openTestimonialDialog(t); if (button.classList.contains("delete-testimonial") && await showConfirmation(`Delete testimonial from ${t.author_name}?`)) { const { error } = await supabase.from("testimonials").delete().eq("id", t.id); if (error) return reportError(error); testimonials = testimonials.filter((item) => item.id !== t.id); renderTestimonials(); } });
form.addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(form); try { const existing = cakes.find((cake) => cake.id === editingId); const image_url = data.get("image")?.size ? await uploadImage(data.get("image")) : existing?.image_url || ""; const cakeData = { name: data.get("name"), price: Number(data.get("price")), category: data.get("category"), description: data.get("description") || "", image_url }; const result = editingId ? await supabase.from("cakes").update(cakeData).eq("id", editingId).select().single() : await supabase.from("cakes").insert(cakeData).select().single(); if (result.error) throw result.error; cakes = editingId ? cakes.map((cake) => cake.id === editingId ? result.data : cake) : [result.data, ...cakes]; form.reset(); editingId = null; dialog.close(); renderCakes(); } catch (error) { reportError(error); } });
testimonialForm.addEventListener("submit", async (event) => { event.preventDefault(); const data = new FormData(testimonialForm); try { const existing = testimonials.find((t) => t.id === editingTestimonialId); const avatar_url = data.get("image")?.size ? await uploadImage(data.get("image")) : existing?.avatar_url || ""; const tData = { author_name: data.get("author_name"), content: data.get("content"), avatar_url }; const result = editingTestimonialId ? await supabase.from("testimonials").update(tData).eq("id", editingTestimonialId).select().single() : await supabase.from("testimonials").insert(tData).select().single(); if (result.error) throw result.error; testimonials = editingTestimonialId ? testimonials.map((t) => t.id === editingTestimonialId ? result.data : t) : [...testimonials, result.data]; testimonialForm.reset(); testimonialDialog.close(); renderTestimonials(); } catch (error) { reportError(error); } });

async function start() { await loadData(); renderCakes(); renderStory(); renderTestimonials(); if (isAdminView) document.querySelector("#admin").scrollIntoView(); }
start();

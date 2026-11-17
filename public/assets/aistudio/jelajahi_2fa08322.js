const sidebar = document.getElementById('sidebar');
const mobileMenu = document.getElementById('mobileMenu');
const toast = document.getElementById('toast');
const materialGrid = document.getElementById('materialGrid');
const cards = [...document.querySelectorAll('.material-card')];
const filters = [...document.querySelectorAll('.filter-chip')];
const materialSearch = document.getElementById('materialSearch');
const globalSearch = document.getElementById('globalSearch');
const noResults = document.getElementById('noResults');
const resultCount = document.getElementById('resultCount');
const modal = document.getElementById('materialModal');
let activeFilter = 'all';
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
mobileMenu?.addEventListener('click', () => sidebar.classList.toggle('open'));
document.querySelectorAll('[data-coming]').forEach(el => el.addEventListener('click', e => {
  e.preventDefault();
  showToast(`${el.dataset.coming} akan dikembangkan pada tahap berikutnya.`);
}));

function applyFilters() {
  const q = (materialSearch.value || '').trim().toLowerCase();
  let visible = 0;
  cards.forEach(card => {
    const haystack = `${card.dataset.title} ${card.dataset.keywords} ${card.textContent}`.toLowerCase();
    const matchCategory = activeFilter === 'all' || card.dataset.category === activeFilter;
    const matchSearch = !q || haystack.includes(q);
    const show = matchCategory && matchSearch;
    card.hidden = !show;
    if (show) visible++;
  });
  resultCount.textContent = `${visible} materi ditemukan`;
  noResults.hidden = visible !== 0;
  materialGrid.hidden = visible === 0;
}
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  activeFilter = button.dataset.filter;
  applyFilters();
}));
materialSearch.addEventListener('input', applyFilters);
globalSearch.addEventListener('input', () => {
  materialSearch.value = globalSearch.value;
  applyFilters();
  document.querySelector('.filter-section').scrollIntoView({behavior:'smooth', block:'start'});
});
document.getElementById('resetFilters').addEventListener('click', () => {
  activeFilter = 'all';
  materialSearch.value = '';
  globalSearch.value = '';
  filters.forEach(item => item.classList.toggle('active', item.dataset.filter === 'all'));
  applyFilters();
});

const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalCategory = document.getElementById('modalCategory');
const modalArt = document.getElementById('modalArt');
let selectedMaterial = '';
function openModal(card) {
  selectedMaterial = card.dataset.title;
  const title = card.dataset.title;
  const category = card.dataset.category;
  const emoji = card.querySelector('.art-emoji').textContent;
  const description = card.querySelector('.card-body p').textContent;
  modalTitle.textContent = title;
  modalDescription.textContent = description;
  modalArt.textContent = emoji;
  const categoryNames = {manusia:'BIOLOGI MANUSIA',hewan:'BIOLOGI HEWAN',tumbuhan:'BIOLOGI TUMBUHAN',sel:'SEL & MIKROORGANISME'};
  const tagClasses = {manusia:'tag-human',hewan:'tag-animal',tumbuhan:'tag-plant',sel:'tag-cell'};
  modalCategory.textContent = categoryNames[category];
  modalCategory.className = `subject-tag ${tagClasses[category]}`;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}
cards.forEach(card => card.querySelector('.open-material').addEventListener('click', () => openModal(card)));
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('closeModalBottom').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
document.getElementById('startMaterial').addEventListener('click', () => {

    // Mengubah judul materi menjadi format URL
    const materialSlug = selectedMaterial
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

    // Mengarahkan siswa ke halaman detail
    window.location.href = `detail.html?materi=${materialSlug}`;

});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    globalSearch.focus();
  }
});

const toast = document.getElementById('toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

document.querySelectorAll('[data-toast]').forEach(button => {
  button.addEventListener('click', () => showToast(button.dataset.toast));
});

document.querySelectorAll('[data-scroll]').forEach(button => {
  button.addEventListener('click', () => {
    const target = document.querySelector(button.dataset.scroll);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('click', () => {
    const title = card.querySelector('h3').textContent;
    showToast(`Kategori "${title}" dipilih. Halaman materi akan kita buat pada tahap berikutnya.`);
  });
});

// Search filters the learning category cards on the dashboard.
const searchInput = document.getElementById('searchInput');
const categoryCards = [...document.querySelectorAll('.category-card')];
const emptySearch = document.getElementById('emptySearch');

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim().toLocaleLowerCase('id');
  let visible = 0;
  categoryCards.forEach(card => {
    const searchable = `${card.dataset.search} ${card.innerText}`.toLocaleLowerCase('id');
    const match = searchable.includes(query);
    card.hidden = !match;
    if (match) visible++;
  });
  emptySearch.hidden = visible !== 0;
});

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
  }
});

// Sidebar links act as navigation placeholders until their pages are developed.
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    document.querySelectorAll('.nav-link').forEach(item => item.classList.remove('active'));
    link.classList.add('active');
    const pageName = link.dataset.page || 'Dashboard';
    document.getElementById('currentPage').textContent = pageName;
    if (pageName !== 'Dashboard') showToast(`Halaman ${pageName} akan kita kembangkan berikutnya.`);
    document.getElementById('sidebar').classList.remove('open');
  });
});

const mobileMenu = document.getElementById('mobileMenu');
mobileMenu.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

document.addEventListener('click', event => {
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 980 && sidebar.classList.contains('open') &&
      !sidebar.contains(event.target) && !mobileMenu.contains(event.target)) {
    sidebar.classList.remove('open');
  }
});

// Local date, formatted in Indonesian.
document.getElementById('todayDate').textContent = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
}).format(new Date());

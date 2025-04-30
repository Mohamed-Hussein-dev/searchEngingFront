const resultsDiv = document.getElementById('results');
const paginationDiv = document.getElementById('pagination');
const fallbackImage = "https://dummyimage.com/240x180/cccccc/000000&text=No+Image";

let currentPage = 1;
const pageSize = 10;
let totalCount = 0;
let currentItems = [];

// render the items for the current page
function renderResults() {
   resultsDiv.innerHTML = currentItems.map(item => `
    <div class="result-item">
      <div class="image-container">
        <img class="result-image"
             src="${item.imageURL || fallbackImage}"
             alt="${item.englishName}">
      </div>
      <div class="result-title">${item.englishName}</div>
      <div class="result-details">
        <div>💰 ${item.price} EGP</div>
        <div>🧪 ${item.activeIngredient}</div>
        <div>📊 ${item.barCode}</div>
      </div>
    </div>
  `).join('');
   renderPagination();
}

// “Google‑style” paginator (first/last + ellipses)
function renderPagination() {
   paginationDiv.innerHTML = '';
   const totalPages = Math.ceil(totalCount / pageSize);
   if (totalPages <= 1) return;

   const delta = 2;
   const range = [1];
   for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) range.push(i);
   }
   if (totalPages > 1) range.push(totalPages);

   const pages = [...new Set(range)].sort((a, b) => a - b);
   let last = 0;

   pages.forEach(p => {
      if (p - last > 1) {
         const span = document.createElement('span');
         span.textContent = '…';
         span.classList.add('ellipse');
         paginationDiv.appendChild(span);
      }
      const btn = document.createElement('button');
      btn.textContent = p;
      if (p === currentPage) btn.classList.add('active');
      btn.addEventListener('click', () => {
         if (p !== currentPage) fetchPage(p);
      });
      paginationDiv.appendChild(btn);
      last = p;
   });
}

// fetch page from your API, using your DTO of { items, total }
async function fetchPage(pageIndex = 1) {
   const name = document.getElementById('name').value.trim();
   const tol = document.getElementById('tolerance').value.trim();

   if (!name) {
      showError('Please enter a drug name');
      return;
   }
   if (name.length < 3) {
      showError('Minimum 3 characters required');
      return;
   }

   const tolerance = tol === '' ? 10 : parseInt(tol, 10);
   resultsDiv.innerHTML = '<div class="loading">Searching medications...</div>';
   paginationDiv.innerHTML = '';

   try {
      const resp = await fetch(
         `https://localhost:7285/api/SearchEngine/search`
         + `?name=${encodeURIComponent(name)}`
         + `&tolerance=${tolerance}`
         + `&pageIndex=${pageIndex}`
         + `&pageSize=${pageSize}`
      );
      // If the call fails at the network level, this throws
      if (!resp.ok) {
         throw new Error(`Server responded with ${resp.status}`);
      }

      // match your DTO: { items: DrugDto[], total: number }
      const json = await resp.json();
      const items = json.items || [];
      const total = json.total;

      console.log("total count:", total);

      if (!items.length) {
         showNoResults(name);
         return;
      }

      currentPage = pageIndex;
      currentItems = items;
      totalCount = total;
      renderResults();
   }
   catch (err) {
      // distinguish network vs. API errors
      console.error(err);
      showError(err.message.includes('Failed to fetch')
         ? 'Network error: please check your connection'
         : err.message);
   }
}

function showError(msg) {
   resultsDiv.innerHTML = `
    <div class="no-results">
      ${msg}
      <div style="margin-top:10px;font-size:0.9em">Please try again</div>
    </div>`;
}

function showNoResults(name) {
   resultsDiv.innerHTML = `
    <div class="no-results">
      No results found for "${name}"
      <div style="margin-top:10px;font-size:0.9em">Try increasing tolerance value</div>
    </div>`;
}

// initial search call
function search() {
   fetchPage(1);
}

// live‐search on input
let timeout;
document.getElementById('name').addEventListener('input', () => {
   clearTimeout(timeout);
   timeout = setTimeout(() => {
      if (document.getElementById('name').value.trim().length >= 3) {
         fetchPage(1);
      }
   }, 400);
});

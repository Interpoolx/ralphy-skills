let allSkills = [];
let currentCategory = null;

function normalizeText(value) {
  return String(value ?? '').toLowerCase();
}

function matchesQuery(skill, query) {
  if (!query) return true;

  const haystack = [
    skill.id,
    skill.name,
    skill.description,
    ...(Array.isArray(skill.tags) ? skill.tags : []),
    ...(Array.isArray(skill.keywords) ? skill.keywords : []),
    skill.category,
    skill.author?.name,
    skill.author?.github,
  ]
    .map(normalizeText)
    .join(' ');

  return haystack.includes(query);
}

function getFilteredSkills() {
  const query = normalizeText(document.getElementById('searchInput')?.value).trim();
  return allSkills.filter((skill) => {
    const categoryOk = !currentCategory || skill.category === currentCategory;
    const queryOk = matchesQuery(skill, query);
    return categoryOk && queryOk;
  });
}

function setActiveFilterButton(category) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach((btn) => {
    const btnCat = btn.getAttribute('data-category');
    const isActive = category === null ? btnCat === '' : btnCat === category;
    btn.classList.toggle('active', isActive);
  });
}

function renderSkills(skills) {
  const grid = document.getElementById('skillsGrid');
  if (!grid) return;

  if (!skills.length) {
    grid.innerHTML = '<div class="empty">No skills found</div>';
    return;
  }

  grid.innerHTML = skills
    .map((skill) => {
      const tags = Array.isArray(skill.tags) ? skill.tags.slice(0, 4) : [];
      return `
        <div class="skill-card" data-skill-id="${skill.id}">
          <div class="skill-name">${skill.name ?? skill.id}</div>
          <div class="skill-description">${skill.description ?? 'No description'}</div>
          <div class="skill-meta">
            ${skill.category ? `<span class="tag category-tag">${skill.category}</span>` : ''}
            ${skill.verified ? '<span class="tag verified-tag">verified</span>' : ''}
            ${tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
      `;
    })
    .join('');

  grid.querySelectorAll('.skill-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-skill-id');
      if (id) viewSkill(id);
    });
  });
}

function viewSkill(id) {
  const skill = allSkills.find((s) => s.id === id);
  if (!skill) return;

  const lines = [
    `Skill: ${skill.name ?? id}`,
    `ID: ${id}`,
    '',
    skill.description ? `Description: ${skill.description}` : null,
    skill.source ? `Source: ${skill.source}` : null,
    '',
    'Install:',
    `  npx ralphy-skills install ${id}`,
  ].filter(Boolean);

  alert(lines.join('\n'));
}

function setupFilters(categories) {
  const filtersDiv = document.getElementById('categoryFilters');
  if (!filtersDiv) return;

  filtersDiv.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn active';
  allBtn.type = 'button';
  allBtn.textContent = 'All';
  allBtn.setAttribute('data-category', '');
  allBtn.addEventListener('click', () => {
    currentCategory = null;
    setActiveFilterButton(null);
    renderSkills(getFilteredSkills());
  });
  filtersDiv.appendChild(allBtn);

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.type = 'button';
    btn.textContent = cat;
    btn.setAttribute('data-category', cat);
    btn.addEventListener('click', () => {
      currentCategory = cat;
      setActiveFilterButton(cat);
      renderSkills(getFilteredSkills());
    });
    filtersDiv.appendChild(btn);
  });
}

function setupStats(marketplace) {
  const skillsCount = document.getElementById('skillsCount');
  const verifiedCount = document.getElementById('verifiedCount');
  const categoriesCount = document.getElementById('categoriesCount');

  const verified = allSkills.filter((s) => s.verified).length;
  const categories = new Set(allSkills.map((s) => s.category).filter(Boolean));

  if (skillsCount) skillsCount.textContent = String(allSkills.length);
  if (verifiedCount) verifiedCount.textContent = String(verified);
  if (categoriesCount) categoriesCount.textContent = String(categories.size);

  if (marketplace?.metadata?.total_skills && marketplace.metadata.total_skills > allSkills.length) {
    if (skillsCount) skillsCount.title = `Marketplace metadata: ${marketplace.metadata.total_skills}`;
  }
}

async function loadMarketplace() {
  const grid = document.getElementById('skillsGrid');
  if (grid) grid.innerHTML = '<div class="loading">Loading marketplace...</div>';

  try {
    // Fetch from GitHub raw URL (single source of truth)
    const githubUrl = 'https://raw.githubusercontent.com/Interpoolx/ralphy-skills/main/marketplace.json';
    const localUrl = './marketplace.json';
    
    // Try GitHub first, fallback to local copy if it exists (for local development)
    let response;
    try {
      response = await fetch(githubUrl, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`GitHub fetch failed: ${response.status}`);
    } catch (e) {
      console.warn('GitHub fetch failed, trying local fallback:', e);
      response = await fetch(localUrl, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Local fetch failed: ${response.status}`);
    }

    const marketplace = await response.json();
    allSkills = Array.isArray(marketplace.skills) ? marketplace.skills : [];

    const categories = Array.isArray(marketplace.categories) && marketplace.categories.length
      ? marketplace.categories
      : [...new Set(allSkills.map((s) => s.category).filter(Boolean))];

    setupStats(marketplace);
    setupFilters(categories);
    renderSkills(getFilteredSkills());
  } catch (error) {
    console.error(error);
    if (grid) grid.innerHTML = '<div class="empty">Failed to load marketplace.json</div>';
  }
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  const button = document.getElementById('searchButton');

  const run = () => renderSkills(getFilteredSkills());

  if (input) {
    input.addEventListener('input', run);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') run();
    });
  }
  if (button) button.addEventListener('click', run);
}

setupSearch();
loadMarketplace();

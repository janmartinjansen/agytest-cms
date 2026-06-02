// --- CMS State ---
const state = {
  view: 'gebruiker', // 'gebruiker' | 'beheerder'
  items: [],
  currentIndex: 0,
  scriptUrl: localStorage.getItem('agy_cms_script_url') || '',
  isMockMode: true,
  isLoading: false
};

// --- Mock Data ---
const mockItems = [
  {
    id: "mock_1",
    naam: "🚀 Welkom bij Agy CMS",
    inhoud: `# Welkom bij het Agy CMS!

Dit is een klein, elegant **Content Management Systeem** dat volledig draait op een statische webpagina en gekoppeld is aan **Google Sheets** via **Google Apps Script**.

### Wat kunt u hiermee?
1. **Beheerder-modus**: Klik hierboven op *Beheerder* om content toe te voegen, te bewerken of te verwijderen.
2. **Live Markdown**: Schrijf uw inhoud in Markdown. De app vertaalt dit direct naar een strakke weergave.
3. **Snel Toetsenbordnavigatie**: Gebruik de **pijltjestoetsen links (←) en rechts (→)** op uw toetsenbord om door deze pagina's te bladeren!

*Dit item is momenteel geladen uit de ingebouwde mock-data omdat er nog geen koppeling met een Google Sheet actief is.*`
  },
  {
    id: "mock_2",
    naam: "⚙️ Hoe werkt de Sheets integratie?",
    inhoud: `# Hoe werkt de Sheets integratie?

Het CMS maakt gebruik van een slimme, serverloze architectuur om uw content direct in Google Drive op te slaan.

### De Architectuur
- **Frontend**: Deze statische pagina (HTML, CSS en JavaScript). Kan overal gehost worden, bijv. op **GitHub Pages**.
- **Database**: Een doodgewone **Google Sheet** in uw Drive.
- **API Bridge**: Een klein **Google Apps Script** gekoppeld aan de sheet dat fungeert als API-server.

### Live gaan in 3 stappen:
1. Open de **Instellingen** (het tandwiel ⚙️ rechtsboven).
2. Volg de instructies in de **README.md** om uw Google Sheet en het Apps Script aan te maken.
3. Plak de verkregen **Web-app URL** in het instellingenveld en sla op.

Zodra de koppeling actief is, verdwijnt de gele waarschuwingsbanner en leest/schrijft u direct live in de spreadsheet!`
  },
  {
    id: "mock_3",
    naam: "📝 Markdown Demonstratie",
    inhoud: `# De Kracht van Markdown

De inhoud van uw artikelen ondersteunt volledige Markdown-opmaak. Hier is een kort overzicht van wat u kunt gebruiken:

### Tekstopmaak
U kunt tekst *cursief*, **vet**, of zelfs ~~doorgestreept~~ maken.

### Lijsten
* Dit is een opsomming
* Met meerdere niveaus
  * Sub-item

### Citaten (Blockquotes)
> "Het geheim van vooruitgang is beginnen." - Mark Twain

### Code & Syntax Highlighting
U kunt inline code schrijven zoals \`const agy = 'awesome'\`, of codeblokken:

\`\`\`javascript
function begroet(naam) {
  console.log("Hallo " + naam + ", welkom in ons CMS!");
}
begroet("Gebruiker");
\`\`\`

Probeer gerust zelf nieuwe items aan te maken via de beheerder om dit te testen!`
  }
];

// --- DOM Elements ---
const DOM = {
  navGebruiker: document.getElementById('nav-gebruiker'),
  navBeheerder: document.getElementById('nav-beheerder'),
  btnSettings: document.getElementById('btn-settings'),
  mockBanner: document.getElementById('mock-banner'),
  btnCloseBanner: document.getElementById('btn-close-banner'),
  
  viewGebruiker: document.getElementById('view-gebruiker'),
  viewBeheerder: document.getElementById('view-beheerder'),
  
  // Reader
  readerCard: document.getElementById('reader-card'),
  readerTitle: document.getElementById('reader-title'),
  readerBody: document.getElementById('reader-body'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  pagination: document.getElementById('pagination'),
  readerLoader: document.getElementById('reader-loader'),
  
  // Admin Table
  adminTableBody: document.getElementById('admin-table-body'),
  btnAddItem: document.getElementById('btn-add-item'),
  adminLoader: document.getElementById('admin-loader'),
  
  // Editor Modal
  modalEditor: document.getElementById('modal-editor'),
  editorTitle: document.getElementById('editor-modal-title'),
  btnCloseEditor: document.getElementById('btn-close-editor'),
  btnCancelEditor: document.getElementById('btn-cancel-editor'),
  formEditor: document.getElementById('form-editor'),
  inputId: document.getElementById('item-id'),
  inputNaam: document.getElementById('item-naam'),
  textareaInhoud: document.getElementById('item-inhoud'),
  previewPane: document.getElementById('editor-preview'),
  btnSaveItem: document.getElementById('btn-save-item'),
  
  // Settings Modal
  modalSettings: document.getElementById('modal-settings'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  btnCancelSettings: document.getElementById('btn-cancel-settings'),
  inputScriptUrl: document.getElementById('settings-script-url'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  
  // Toasts
  toastContainer: document.getElementById('toast-container')
};

// --- Initialisatie ---
document.addEventListener('DOMContentLoaded', () => {
  init();
});

function init() {
  // Controleer of er een geldige URL is opgeslagen
  if (state.scriptUrl && state.scriptUrl.trim().startsWith('https://')) {
    state.isMockMode = false;
    DOM.mockBanner.style.display = 'none';
  } else {
    state.isMockMode = true;
    DOM.mockBanner.style.display = 'flex';
  }
  
  // Event listeners binden
  bindEvents();
  
  // Eerste data ophalen
  loadData();
}

// --- Event Listeners ---
function bindEvents() {
  // Navigatie
  DOM.navGebruiker.addEventListener('click', () => showView('gebruiker'));
  DOM.navBeheerder.addEventListener('click', () => showView('beheerder'));
  
  // Settings
  DOM.btnSettings.addEventListener('click', openSettingsModal);
  DOM.btnCloseSettings.addEventListener('click', closeSettingsModal);
  DOM.btnCancelSettings.addEventListener('click', closeSettingsModal);
  DOM.btnSaveSettings.addEventListener('click', saveSettings);
  
  // Banner
  DOM.btnCloseBanner.addEventListener('click', () => {
    DOM.mockBanner.style.display = 'none';
  });
  
  // Reader controls
  DOM.btnPrev.addEventListener('click', prevPage);
  DOM.btnNext.addEventListener('click', nextPage);
  
  // Toetsenbordnavigatie voor de Reader
  document.addEventListener('keydown', (e) => {
    if (state.view === 'gebruiker' && !isModalOpen()) {
      if (e.key === 'ArrowLeft') prevPage();
      if (e.key === 'ArrowRight') nextPage();
    }
  });
  
  // Admin CRUD acties
  DOM.btnAddItem.addEventListener('click', () => openEditorModal());
  DOM.btnCloseEditor.addEventListener('click', closeEditorModal);
  DOM.btnCancelEditor.addEventListener('click', closeEditorModal);
  DOM.formEditor.addEventListener('submit', (e) => {
    e.preventDefault();
    saveItem();
  });
  
  // Live Markdown Preview in Editor
  DOM.textareaInhoud.addEventListener('input', updateEditorPreview);
}

// --- View Logica ---
function showView(viewName) {
  state.view = viewName;
  
  if (viewName === 'gebruiker') {
    DOM.navGebruiker.classList.add('active');
    DOM.navBeheerder.classList.remove('active');
    DOM.viewGebruiker.classList.add('active');
    DOM.viewBeheerder.classList.remove('active');
    renderReader();
  } else {
    DOM.navGebruiker.classList.remove('active');
    DOM.navBeheerder.classList.add('active');
    DOM.viewGebruiker.classList.remove('active');
    DOM.viewBeheerder.classList.add('active');
    renderAdmin();
  }
}

function isModalOpen() {
  return DOM.modalEditor.classList.contains('active') || DOM.modalSettings.classList.contains('active');
}

// --- Data Fetching & Sync ---
async function loadData() {
  setLoading(true);
  
  if (state.isMockMode) {
    // Laad uit geheugen / localStorage
    const saved = localStorage.getItem('agy_cms_mock_items');
    if (saved) {
      state.items = JSON.parse(saved);
    } else {
      state.items = [...mockItems];
      localStorage.setItem('agy_cms_mock_items', JSON.stringify(state.items));
    }
    
    // Kort vertragingseffect voor premium uitstraling van loaders
    setTimeout(() => {
      setLoading(false);
      state.currentIndex = 0;
      renderReader();
      renderAdmin();
    }, 400);
  } else {
    // Live ophalen van Google Sheet via Apps Script
    try {
      const response = await fetch(`${state.scriptUrl}?action=readAll`, {
        method: 'GET',
        mode: 'cors'
      });
      
      const result = await response.json();
      
      if (result.success) {
        state.items = result.data || [];
        showToast("Gegevens succesvol geladen uit Google Sheets", "success");
      } else {
        throw new Error(result.error || "Fout bij ophalen");
      }
    } catch (error) {
      console.error(error);
      showToast("Fout bij laden live gegevens. Schakelt over naar mock-modus.", "error");
      
      // Fallback naar mock mode bij verbindingsproblemen
      state.isMockMode = true;
      DOM.mockBanner.style.display = 'flex';
      const saved = localStorage.getItem('agy_cms_mock_items') || JSON.stringify(mockItems);
      state.items = JSON.parse(saved);
    } finally {
      setLoading(false);
      state.currentIndex = 0;
      renderReader();
      renderAdmin();
    }
  }
}

function setLoading(isLoading) {
  state.isLoading = isLoading;
  if (isLoading) {
    DOM.readerLoader.classList.add('active');
    DOM.adminLoader.classList.add('active');
  } else {
    DOM.readerLoader.classList.remove('active');
    DOM.adminLoader.classList.remove('active');
  }
}

// --- Reader Rendering ---
function renderReader() {
  if (state.items.length === 0) {
    DOM.readerTitle.textContent = "";
    DOM.readerBody.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        <h3>Geen content beschikbaar</h3>
        <p>Er is nog geen content toegevoegd. Klik bovenaan op 'Beheerder' om een nieuw item te maken.</p>
      </div>
    `;
    DOM.btnPrev.disabled = true;
    DOM.btnNext.disabled = true;
    DOM.pagination.textContent = "0 / 0";
    return;
  }
  
  // Grenzen bewaken
  if (state.currentIndex < 0) state.currentIndex = 0;
  if (state.currentIndex >= state.items.length) state.currentIndex = state.items.length - 1;
  
  const item = state.items[state.currentIndex];
  DOM.readerTitle.textContent = item.naam;
  
  // Render Markdown naar HTML met behulp van marked.js CDN library
  try {
    DOM.readerBody.innerHTML = marked.parse(item.inhoud || "");
  } catch (e) {
    // Eenvoudige fallback als marked.js niet geladen is
    DOM.readerBody.innerHTML = (item.inhoud || "").replace(/\n/g, '<br>');
  }
  
  // Controls bijwerken
  DOM.btnPrev.disabled = state.currentIndex === 0;
  DOM.btnNext.disabled = state.currentIndex === state.items.length - 1;
  DOM.pagination.textContent = `${state.currentIndex + 1} / ${state.items.length}`;
}

function prevPage() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderReader();
    animateCard('left');
  }
}

function nextPage() {
  if (state.currentIndex < state.items.length - 1) {
    state.currentIndex++;
    renderReader();
    animateCard('right');
  }
}

function animateCard(direction) {
  DOM.readerCard.style.transition = 'none';
  DOM.readerCard.style.transform = direction === 'right' ? 'translateX(20px)' : 'translateX(-20px)';
  DOM.readerCard.style.opacity = '0.7';
  
  setTimeout(() => {
    DOM.readerCard.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    DOM.readerCard.style.transform = 'translateX(0)';
    DOM.readerCard.style.opacity = '1';
  }, 50);
}

// --- Admin Rendering ---
function renderAdmin() {
  DOM.adminTableBody.innerHTML = "";
  
  if (state.items.length === 0) {
    DOM.adminTableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">
          Geen items gevonden. Klik op "Nieuw item" om te beginnen.
        </td>
      </tr>
    `;
    return;
  }
  
  state.items.forEach(item => {
    const row = document.createElement('tr');
    
    // Maak een excerpt van de Markdown inhoud
    const plainText = (item.inhoud || "").replace(/[#*`~_]/g, '');
    const excerpt = plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText;
    
    row.innerHTML = `
      <td class="col-id" title="${item.id}">${item.id}</td>
      <td class="col-name">${escapeHtml(item.naam)}</td>
      <td class="col-excerpt" title="${escapeHtml(item.inhoud)}">${escapeHtml(excerpt)}</td>
      <td class="actions-cell">
        <button class="btn-action edit-btn" data-id="${item.id}" title="Item bewerken">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        </button>
        <button class="btn-action delete-btn" data-id="${item.id}" title="Item verwijderen">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </td>
    `;
    
    // Event listeners binden aan de knoppen
    row.querySelector('.edit-btn').addEventListener('click', () => openEditorModal(item.id));
    row.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id));
    
    DOM.adminTableBody.appendChild(row);
  });
}

// --- CRUD Acties ---

// Open Editor Modal (Nieuw of Bewerken)
function openEditorModal(id = null) {
  DOM.formEditor.reset();
  DOM.inputId.value = "";
  DOM.previewPane.innerHTML = "<p style='color: var(--text-muted); font-style: italic;'>Voorvertoning verschijnt hier...</p>";
  
  if (id) {
    DOM.editorTitle.textContent = "📝 Item Bewerken";
    const item = state.items.find(i => i.id === id);
    if (item) {
      DOM.inputId.value = item.id;
      DOM.inputNaam.value = item.naam;
      DOM.textareaInhoud.value = item.inhoud;
      updateEditorPreview();
    }
  } else {
    DOM.editorTitle.textContent = "➕ Nieuw Item Toevoegen";
  }
  
  DOM.modalEditor.classList.add('active');
  DOM.inputNaam.focus();
}

function closeEditorModal() {
  DOM.modalEditor.classList.remove('active');
}

// Live Preview Update
function updateEditorPreview() {
  const content = DOM.textareaInhoud.value;
  if (!content.trim()) {
    DOM.previewPane.innerHTML = "<p style='color: var(--text-muted); font-style: italic;'>Voorvertoning verschijnt hier...</p>";
    return;
  }
  
  try {
    DOM.previewPane.innerHTML = marked.parse(content);
  } catch (e) {
    DOM.previewPane.innerHTML = content.replace(/\n/g, '<br>');
  }
}

// Opslaan (Create / Update)
async function saveItem() {
  const id = DOM.inputId.value;
  const naam = DOM.inputNaam.value.trim();
  const inhoud = DOM.textareaInhoud.value;
  
  if (!naam) {
    showToast("Naam is verplicht.", "error");
    return;
  }
  
  setLoading(true);
  closeEditorModal();
  
  const payload = { id, naam, inhoud };
  const action = id ? 'update' : 'create';
  
  if (state.isMockMode) {
    // Opslaan in lokaal geheugen
    if (action === 'create') {
      const newItem = {
        id: "id_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000),
        naam,
        inhoud
      };
      state.items.push(newItem);
      showToast("Item succesvol toegevoegd (Mock Mode)", "success");
    } else {
      const idx = state.items.findIndex(i => i.id === id);
      if (idx !== -1) {
        state.items[idx] = payload;
        showToast("Item succesvol bijgewerkt (Mock Mode)", "success");
      }
    }
    
    // Opslaan naar localStorage
    localStorage.setItem('agy_cms_mock_items', JSON.stringify(state.items));
    
    setTimeout(() => {
      setLoading(false);
      renderAdmin();
      renderReader();
    }, 300);
  } else {
    // Live synchroniseren via Apps Script POST
    try {
      const response = await fetch(state.scriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain' // Apps Script handelt text/plain beter af zonder preflight CORS
        },
        body: JSON.stringify({
          action: action,
          payload: payload
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast(
          action === 'create' ? "Item succesvol toegevoegd aan Google Sheet" : "Item succesvol bijgewerkt in Google Sheet", 
          "success"
        );
        // Herlaad alle live data om de weergave te synchroniseren
        await loadData();
      } else {
        throw new Error(result.error || "Fout bij opslaan");
      }
    } catch (error) {
      console.error(error);
      showToast("Fout bij opslaan naar Google Sheet: " + error.message, "error");
      setLoading(false);
    }
  }
}

// Verwijderen
async function deleteItem(id) {
  if (!confirm("Weet u zeker dat u dit item wilt verwijderen?")) {
    return;
  }
  
  setLoading(true);
  
  if (state.isMockMode) {
    state.items = state.items.filter(i => i.id !== id);
    localStorage.setItem('agy_cms_mock_items', JSON.stringify(state.items));
    
    showToast("Item verwijderd (Mock Mode)", "success");
    
    setTimeout(() => {
      setLoading(false);
      // Reset reader index indien nodig
      if (state.currentIndex >= state.items.length && state.items.length > 0) {
        state.currentIndex = state.items.length - 1;
      }
      renderAdmin();
      renderReader();
    }, 300);
  } else {
    try {
      const response = await fetch(state.scriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
          action: 'delete',
          payload: { id }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast("Item succesvol verwijderd uit Google Sheet", "success");
        await loadData();
      } else {
        throw new Error(result.error || "Fout bij verwijderen");
      }
    } catch (error) {
      console.error(error);
      showToast("Fout bij verwijderen uit Google Sheet: " + error.message, "error");
      setLoading(false);
    }
  }
}

// --- Settings Modal ---
function openSettingsModal() {
  DOM.inputScriptUrl.value = state.scriptUrl;
  DOM.modalSettings.classList.add('active');
}

function closeSettingsModal() {
  DOM.modalSettings.classList.remove('active');
}

function saveSettings() {
  const url = DOM.inputScriptUrl.value.trim();
  
  if (url && !url.startsWith('https://')) {
    showToast("Ongeldige URL. De URL moet beginnen met https://", "error");
    return;
  }
  
  state.scriptUrl = url;
  localStorage.setItem('agy_cms_script_url', url);
  
  closeSettingsModal();
  
  if (url) {
    state.isMockMode = false;
    DOM.mockBanner.style.display = 'none';
    showToast("Instellingen opgeslagen. Live verbinding wordt tot stand gebracht...", "info");
  } else {
    state.isMockMode = true;
    DOM.mockBanner.style.display = 'flex';
    showToast("Instellingen opgeslagen. Teruggeschakeld naar Mock-modus.", "info");
  }
  
  // Herlaad de data met de nieuwe instellingen
  loadData();
}

// --- Toast Helpers ---
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  } else {
    iconSvg = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  }
  
  toast.innerHTML = `
    <div class="toast-icon ${type}-icon">${iconSvg}</div>
    <div class="toast-message">${escapeHtml(message)}</div>
  `;
  
  DOM.toastContainer.appendChild(toast);
  
  // Activeer animatie
  setTimeout(() => toast.classList.add('active'), 50);
  
  // Verwijder na 4 seconden
  setTimeout(() => {
    toast.classList.remove('active');
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4000);
}

// --- Algemene Helpers ---
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

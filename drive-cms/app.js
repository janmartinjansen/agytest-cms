// --- CMS State ---
const state = {
  view: 'gebruiker', // 'gebruiker' | 'beheerder'
  items: [], // Array van { id, naam, fileId, inhoud }
  currentIndex: 0,
  scriptUrl: localStorage.getItem('agy_cms_drive_script_url') || '',
  isMockMode: true,
  isLoading: false,
  showPreview: localStorage.getItem('agy_cms_drive_show_preview') === 'true',
  theme: localStorage.getItem('agy_cms_drive_theme') || 'dark'
};

// --- Mock Data ---
const mockItems = [
  {
    id: "mock_1",
    naam: "📁 Welkom bij het Drive CMS",
    inhoud: `# Welkom bij het Drive CMS!

Dit is een variant van ons Content Management Systeem. In plaats van een Google Sheet worden alle artikelen hier opgeslagen als **individuele Markdown-bestanden (\`.md\`)** in een Google Drive-map.

### De Slimme Truc
- **Bestandsnamen als database**: Artikelen worden opgeslagen als \`ID__naam.md\`.
- **Hoge Snelheid**: Het CMS laadt eerst alleen de lijst met bestandsnamen. Dat kost nauwelijks tijd.
- **Lazy Loading**: De daadwerkelijke tekst van dit bestand wordt pas ingeladen vanaf de server op het moment dat u naar dit artikel bladert of op bewerken klikt.

*Dit item is momenteel geladen uit de ingebouwde mock-data omdat er nog geen koppeling met een Google Drive-map actief is.*`
  },
  {
    id: "mock_2",
    naam: "📂 Hoe is de Drive-map opgebouwd?",
    inhoud: `# Hoe is de Drive-map opgebouwd?

Wanneer u de koppeling maakt via uw Google Apps Script Web-app, gebeurt het volgende:

1. Het script zoekt in uw Drive naar de map \`agytest\`.
2. Binnen die map maakt het script automatisch een submap aan genaamd **\`agytest_cms_files\`**.
3. Elk artikel dat u aanmaakt, wordt opgeslagen als een bestand met de naam \`ID__naam.md\`.

### Direct bewerken in Google Drive
Omdat het gewone Markdown-bestanden zijn, kunt u ze in Google Drive direct openen, bewerken of verplaatsen. Het CMS synchroniseert automatisch bij de volgende verversing!`
  },
  {
    id: "mock_3",
    naam: "🎨 Thema's en Extra Features",
    inhoud: `# Thema's en Live Preview

Ook in deze Drive-variant zijn alle premium eigenschappen behouden:

### Features:
- **Lichte & Donkere modus**: Klik op de zon/maan knop in de header om direct te wisselen. Uw voorkeur wordt opgeslagen.
- **Live Preview Checkbox**: In het beheerscherm kunt u de preview naar wens aan- of uitzetten om meer schrijfruimte te krijgen.
- **Toetsenbordnavigatie**: Blader door de bestanden met de **pijltjestoetsen links (←) en rechts (→)** op uw toetsenbord.

Probeer gerust een nieuw bestand aan te maken via het beheerderpaneel!`
  }
];

// --- DOM Elements ---
const DOM = {
  navGebruiker: document.getElementById('nav-gebruiker'),
  navBeheerder: document.getElementById('nav-beheerder'),
  btnSettings: document.getElementById('btn-settings'),
  btnThemeToggle: document.getElementById('btn-theme-toggle'),
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
  editorLayout: document.querySelector('.editor-layout'),
  cbShowPreview: document.getElementById('cb-show-preview'),
  
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
  
  // Thema initialiseren
  if (state.theme === 'light') {
    document.documentElement.classList.add('light-theme');
  } else {
    document.documentElement.classList.remove('light-theme');
  }
  
  // Preview-instelling initialiseren
  DOM.cbShowPreview.checked = state.showPreview;
  togglePreviewLayout(state.showPreview);
  
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
  
  // Theme Toggle
  DOM.btnThemeToggle.addEventListener('click', toggleTheme);
  
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
  
  // Preview checkbox toggle
  DOM.cbShowPreview.addEventListener('change', (e) => {
    state.showPreview = e.target.checked;
    localStorage.setItem('agy_cms_drive_show_preview', state.showPreview);
    togglePreviewLayout(state.showPreview);
  });
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
    const saved = localStorage.getItem('agy_cms_drive_mock_items');
    if (saved) {
      state.items = JSON.parse(saved);
    } else {
      state.items = [...mockItems];
      localStorage.setItem('agy_cms_drive_mock_items', JSON.stringify(state.items));
    }
    
    // Kort vertragingseffect voor de loader
    setTimeout(() => {
      setLoading(false);
      state.currentIndex = 0;
      renderReader();
      renderAdmin();
    }, 400);
  } else {
    // Haal de lijst met bestanden op (ID en Naam) via Apps Script GET ?action=readList
    try {
      const response = await fetch(`${state.scriptUrl}?action=readList`, {
        method: 'GET',
        mode: 'cors'
      });
      
      const result = await response.json();
      
      if (result.success) {
        // De resultaten bevatten [{ id, naam, fileId }]
        // We behouden bestaande in-memory geladen 'inhoud' als we verversen
        const currentContentMap = {};
        state.items.forEach(item => {
          if (item.inhoud !== undefined) {
            currentContentMap[item.id] = item.inhoud;
          }
        });
        
        state.items = (result.data || []).map(item => ({
          ...item,
          inhoud: currentContentMap[item.id] // Behoud geladen content indien aanwezig
        }));
        
        showToast("Bestandsindex geladen uit Google Drive", "success");
      } else {
        throw new Error(result.error || "Fout bij ophalen bestandslijst.");
      }
    } catch (error) {
      console.error(error);
      showToast("Fout bij laden live gegevens. Schakelt over naar mock-modus.", "error");
      
      state.isMockMode = true;
      DOM.mockBanner.style.display = 'flex';
      const saved = localStorage.getItem('agy_cms_drive_mock_items') || JSON.stringify(mockItems);
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

// --- Reader Rendering (Lazy Loading!) ---
async function renderReader() {
  if (state.items.length === 0) {
    DOM.readerTitle.textContent = "";
    DOM.readerBody.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        <h3>Geen Markdown-bestanden gevonden</h3>
        <p>Klik bovenaan op 'Beheerder' om een nieuw bestand aan te maken.</p>
      </div>
    `;
    DOM.btnPrev.disabled = true;
    DOM.btnNext.disabled = true;
    DOM.pagination.textContent = "0 / 0";
    return;
  }
  
  if (state.currentIndex < 0) state.currentIndex = 0;
  if (state.currentIndex >= state.items.length) state.currentIndex = state.items.length - 1;
  
  const item = state.items[state.currentIndex];
  DOM.readerTitle.textContent = item.naam;
  
  // LAZY LOADING: Als het bestand nog geen inhoud in het geheugen heeft, haal deze nu op!
  if (item.inhoud === undefined && !state.isMockMode) {
    DOM.readerLoader.classList.add('active');
    DOM.readerBody.innerHTML = "<p style='color: var(--text-muted); font-style: italic;'>Inhoud ophalen uit Google Drive...</p>";
    
    try {
      const response = await fetch(`${state.scriptUrl}?action=readContent&id=${item.id}`, {
        method: 'GET',
        mode: 'cors'
      });
      const result = await response.json();
      
      if (result.success) {
        item.inhoud = result.data.inhoud;
      } else {
        throw new Error(result.error || "Bestand kon niet worden uitgelezen.");
      }
    } catch (error) {
      console.error(error);
      DOM.readerBody.innerHTML = `<p style="color: var(--danger);">Fout bij inladen bestandsinhoud: ${error.message}</p>`;
      DOM.btnPrev.disabled = state.currentIndex === 0;
      DOM.btnNext.disabled = state.currentIndex === state.items.length - 1;
      DOM.readerLoader.classList.remove('active');
      return;
    } finally {
      DOM.readerLoader.classList.remove('active');
    }
  }
  
  // Render de Markdown
  const markdownText = item.inhoud || "";
  try {
    DOM.readerBody.innerHTML = marked.parse(markdownText);
  } catch (e) {
    DOM.readerBody.innerHTML = markdownText.replace(/\n/g, '<br>');
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
          Geen bestanden gevonden in de Drive-map. Klik op "Nieuw item" om te beginnen.
        </td>
      </tr>
    `;
    return;
  }
  
  state.items.forEach(item => {
    const row = document.createElement('tr');
    
    // Maak een excerpt. Als de inhoud nog niet geladen is, tonen we een placeholder.
    let excerpt = "";
    if (item.inhoud !== undefined) {
      const plainText = (item.inhoud || "").replace(/[#*`~_]/g, '');
      excerpt = plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText;
    } else {
      excerpt = "(Inhoud staat in Google Drive)";
    }
    
    row.innerHTML = `
      <td class="col-id" title="${item.id}">${item.id}</td>
      <td class="col-name">${escapeHtml(item.naam)}</td>
      <td class="col-excerpt" style="font-style: ${item.inhoud === undefined ? 'italic' : 'normal'}">${escapeHtml(excerpt)}</td>
      <td class="actions-cell">
        <button class="btn-action edit-btn" data-id="${item.id}" title="Bestand bewerken">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        </button>
        <button class="btn-action delete-btn" data-id="${item.id}" title="Bestand verwijderen">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </td>
    `;
    
    row.querySelector('.edit-btn').addEventListener('click', () => openEditorModal(item.id));
    row.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id));
    
    DOM.adminTableBody.appendChild(row);
  });
}

// --- CRUD Acties ---

// Open Editor Modal (Lazy Loading!)
async function openEditorModal(id = null) {
  DOM.formEditor.reset();
  DOM.cbShowPreview.checked = state.showPreview;
  togglePreviewLayout(state.showPreview);
  DOM.inputId.value = "";
  DOM.previewPane.innerHTML = "<p style='color: var(--text-muted); font-style: italic;'>Voorvertoning verschijnt hier...</p>";
  
  if (id) {
    DOM.editorTitle.textContent = "📝 Bestand Bewerken";
    const item = state.items.find(i => i.id === id);
    if (item) {
      DOM.inputId.value = item.id;
      DOM.inputNaam.value = item.naam;
      
      // LAZY LOADING: Als we de inhoud nog niet hebben, haal deze live op alvorens de editor te openen!
      if (item.inhoud === undefined && !state.isMockMode) {
        setLoading(true);
        try {
          const response = await fetch(`${state.scriptUrl}?action=readContent&id=${id}`, {
            method: 'GET',
            mode: 'cors'
          });
          const result = await response.json();
          if (result.success) {
            item.inhoud = result.data.inhoud;
          } else {
            throw new Error(result.error || "Bestand kon niet worden geladen.");
          }
        } catch (error) {
          console.error(error);
          showToast("Fout bij laden bestandsinhoud uit Drive: " + error.message, "error");
          setLoading(false);
          return;
        } finally {
          setLoading(false);
        }
      }
      
      DOM.textareaInhoud.value = item.inhoud || "";
      if (state.showPreview) {
        updateEditorPreview();
      }
    }
  } else {
    DOM.editorTitle.textContent = "➕ Nieuw Markdown Bestand";
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

function togglePreviewLayout(show) {
  if (show) {
    DOM.editorLayout.classList.add('show-preview');
    updateEditorPreview();
  } else {
    DOM.editorLayout.classList.remove('show-preview');
  }
}

// Opslaan (Create / Update in Drive)
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
    if (action === 'create') {
      const newItem = {
        id: "id_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000),
        naam,
        inhoud
      };
      state.items.push(newItem);
      showToast("Bestand aangemaakt (Mock Mode)", "success");
    } else {
      const idx = state.items.findIndex(i => i.id === id);
      if (idx !== -1) {
        state.items[idx] = payload;
        showToast("Bestand bijgewerkt (Mock Mode)", "success");
      }
    }
    
    // Opslaan in localStorage
    localStorage.setItem('agy_cms_drive_mock_items', JSON.stringify(state.items));
    
    setTimeout(() => {
      setLoading(false);
      renderAdmin();
      renderReader();
    }, 300);
  } else {
    // Live synchronisatie via Apps Script POST
    try {
      const response = await fetch(state.scriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
          action: action,
          payload: payload
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showToast(
          action === 'create' ? "Bestand succesvol aangemaakt in Google Drive" : "Bestand succesvol bijgewerkt in Google Drive", 
          "success"
        );
        // Herlaad de bestandslijst
        await loadData();
      } else {
        throw new Error(result.error || "Fout bij opslaan.");
      }
    } catch (error) {
      console.error(error);
      showToast("Fout bij opslaan naar Google Drive: " + error.message, "error");
      setLoading(false);
    }
  }
}

// Verwijderen (Verplaats naar prullenbak)
async function deleteItem(id) {
  if (!confirm("Weet u zeker dat u dit bestand wilt verplaatsen naar de Google Drive prullenbak?")) {
    return;
  }
  
  setLoading(true);
  
  if (state.isMockMode) {
    state.items = state.items.filter(i => i.id !== id);
    localStorage.setItem('agy_cms_drive_mock_items', JSON.stringify(state.items));
    
    showToast("Bestand verwijderd (Mock Mode)", "success");
    
    setTimeout(() => {
      setLoading(false);
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
        showToast("Bestand succesvol verplaatst naar de prullenbak in Google Drive", "success");
        await loadData();
      } else {
        throw new Error(result.error || "Fout bij verwijderen.");
      }
    } catch (error) {
      console.error(error);
      showToast("Fout bij verwijderen uit Google Drive: " + error.message, "error");
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
  localStorage.setItem('agy_cms_drive_script_url', url);
  
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
  
  // Herlaad de data
  loadData();
}

// --- Theme Toggle ---
function toggleTheme() {
  if (document.documentElement.classList.contains('light-theme')) {
    document.documentElement.classList.remove('light-theme');
    state.theme = 'dark';
    showToast("Donkere modus geactiveerd", "info");
  } else {
    document.documentElement.classList.add('light-theme');
    state.theme = 'light';
    showToast("Lichte modus geactiveerd", "info");
  }
  localStorage.setItem('agy_cms_drive_theme', state.theme);
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
  
  setTimeout(() => toast.classList.add('active'), 50);
  
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

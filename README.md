# Google Sheets CMS & Single Page Webapp

Dit project is een minimalistisch, premium Content Management Systeem (CMS) dat direct gekoppeld is aan een Google Sheet. De frontend is een statische single-page webpagina (HTML/CSS/JS) die lokaal draait en via GitHub Pages kan worden gepubliceerd. De backend is een Google Apps Script dat als een JSON API fungeert.

---

## 📁 Projectstructuur

- `index.html` - De single-page applicatie-interface (Lezer, Beheerder, Instellingen en Toasts).
- `style.css` - Premium styling (glassmorphism donker thema, responsive lay-outs, vloeiende micro-animaties).
- `app.js` - De JavaScript-logica (Markdown-rendering met Marked via CDN, CRUD API-aanroepen, LocalStorage-integratie en toetsenbordnavigatie).
- `Code.gs` - De backend Google Apps Script-code die u in de script-editor van uw Google Sheet plakt.
- `.gitignore` - Voorkomt dat systeembestanden in Git worden opgenomen.

---

## 🛠️ Stappen voor het handmatige voorwerk

Volg deze stappen om uw Google Sheet en Apps Script te activeren:

### Stap 1: Google Sheet Aanmaken in Google Drive
1. Open uw **Google Drive**.
2. Navigeer naar uw map `agytest` op het hoogste niveau.
3. Maak hier een nieuwe **Google Sheet** (Google Spreadsheets) aan en geef deze bijvoorbeeld de naam `CMS Content`.
4. In het eerste tabblad (meestal genaamd "Blad1" of "Sheet1"), maakt u in de eerste rij (rij 1) exact de volgende drie kolommen aan:
   - **A1**: `ID`
   - **B1**: `naam`
   - **C1**: `inhoud`

### Stap 2: Apps Script Editor Openen
1. In uw geopende Google Sheet, klik in het menu bovenaan op **Uitbreidingen** (Extensions) -> **Apps Script**.
2. Er opent zich een nieuw tabblad met een code-editor. Er staat waarschijnlijk een lege functie `myFunction()`.

### Stap 3: Code Kopiëren en Plakken
1. Open het bestand `Code.gs` uit deze map in uw code-editor op uw computer.
2. Kopieer de volledige inhoud van `Code.gs`.
3. Selecteer alle tekst in de Google Apps Script-editor en **overschrijf** deze met de gekopieerde code.
4. Klik op het **Opslaan-icoon** (de diskette) of toets `Cmd + S` / `Ctrl + S`.

### Stap 4: Implementeren als Web App (Cruciaal)
1. Klik rechtsboven in de Apps Script-editor op de blauwe knop **Implementeren** (Deploy) -> **Nieuwe implementatie** (New deployment).
2. Klik naast "Selecteer type" (Select type) op het **tandwiel-icoon** en kies **Web-app** (Web app).
3. Vul de velden als volgt in:
   - **Beschrijving**: `CMS API` (of laat leeg)
   - **Uitvoeren als** (Execute as): Kies **Mijzelf** (`Me` - uw eigen e-mailadres)
   - **Wie heeft toegang** (Who has access): Kies **Iedereen** (`Anyone` - uiterst belangrijk om CORS-verbindingen vanaf de browser toe te staan).
4. Klik op de knop **Implementeren** (Deploy).
5. Er verschijnt mogelijk een venster waarin Google u vraagt om de app toegang te verlenen tot uw spreadsheet. Klik op **Toegang verlenen** (Authorize access), log in met uw Google-account en klik op **Geavanceerd** -> **Ga naar ... (onveilig)** en vervolgens op **Toestaan** (Allow).
6. Zodra de implementatie is voltooid, ziet u een sectie genaamd **Web-app**. Kopieer de **URL** die hier staat (deze begint met `https://script.google.com/macros/s/.../exec`).

---

## 💻 Hoe u de Applicatie Test en Gebruikt

### 1. Direct Lokaal Testen (Mock Data Modus)
Open het bestand `index.html` door erop te dubbelklikken. 
* Omdat u nog geen URL heeft ingevoerd, start de app automatisch in **Mock Data** modus. 
* U ziet een stijlvolle gele waarschuwingsbanner bovenaan. U kunt nu alvast records toevoegen, bewerken, verwijderen en doorlezen. Dit gebeurt tijdelijk in het geheugen van de browser.

### 2. Live Gaan met Google Sheets
1. Klik rechtsboven op de webpagina op het **Instellingen-icoon** (het tandwiel ⚙️).
2. Plak uw gekopieerde **Google Apps Script Web App URL** in het invoerveld.
3. Klik op **Instellingen Opslaan**.
4. De waarschuwingsbanner verdwijnt en de app laadt nu live de rijen uit uw Google Sheet. CRUD-acties die u uitvoert worden direct gesynchroniseerd met uw spreadsheet in Google Drive.

### 3. Sneltoetsen
* In de **Gebruiker (Lezer)** modus kunt u met de **pijltjestoets links (←)** en **pijltjestoets rechts (→)** op uw toetsenbord door de contentbladzijden bladeren.

---

## 🐙 Git Versiebeheer & GitHub Pages

De codebase is al geïnitialiseerd als Git repository. Om dit te publiceren via GitHub Pages:

1. Maak een lege repository aan op uw GitHub-account (bijvoorbeeld genaamd `agytest-cms`).
2. Koppel de lokale repository aan GitHub en push de code:
   ```bash
   git remote add origin https://github.com/UW_GITHUB_GEBRUIKERSNAAM/agytest-cms.git
   git branch -M main
   git push -u origin main
   ```
3. Ga op GitHub naar de instellingen van uw repository (**Settings** -> **Pages**).
4. Kies onder **Build and deployment** bij Source voor **Deploy from a branch**.
5. Selecteer de branch `main` en map `/ (root)`, en klik op **Save**.
6. Binnen enkele minuten is uw CMS live op `https://UW_GITHUB_GEBRUIKERSNAAM.github.io/agytest-cms/`!

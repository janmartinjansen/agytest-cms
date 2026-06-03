# Google Drive Folder CMS (Markdown Files)

Dit is een variant van het CMS waarbij elk content-item wordt opgeslagen als een **individueel Markdown-bestand (`.md`)** in een Google Drive-map, in plaats van een cel in een spreadsheet.

---

## 📁 Projectstructuur (Submap `drive-cms`)

- `index.html` - De single-page applicatie-interface (met lichte/donkere modus en preview-opties).
- `style.css` - De premium stylesheet met ondersteuning voor beide thema's en responsive lay-outs.
- `app.js` - De client-side JavaScript, speciaal aangepast voor **Lazy Loading** (haalt de bestandslijst snel op en laadt de inhoud van een artikel pas in zodra er naartoe wordt gebladerd of als het bewerkt wordt).
- `Code.gs` - De Apps Script backendcode die de bestanden beheert in Google Drive.

---

## 🛠️ Hoe u de Google Drive Koppeling Opzet

### Stap 1: Zorg dat de map 'agytest' bestaat
Zorg ervoor dat er in de hoofdmap (toplevel) van uw Google Drive een map staat genaamd `agytest`. (U gaf aan dat u deze al heeft gemaakt).

### Stap 2: Open de Apps Script Editor
Omdat een standalone Apps Script lastiger te deployen is, gebruiken we een kleine Google Sheet als ingang.
1. Ga naar uw Google Drive en open de map `agytest`.
2. Maak een nieuwe **Google Sheet** (Google Spreadsheets) aan en noem deze bijvoorbeeld `Drive CMS Bridge`.
3. Klik in het menu bovenaan op **Uitbreidingen** (Extensions) -> **Apps Script**.
4. Wis alle aanwezige code in de geopende editor.

### Stap 3: Code Plakken en Opslaan
1. Open het bestand `drive-cms/Code.gs` in deze map op uw computer en kopieer de volledige inhoud.
2. Plak deze code in de Google Apps Script-editor in uw browser.
3. Klik op het **Opslaan-icoon** (de diskette) of druk op `Cmd + S` / `Ctrl + S`.

### Stap 4: Implementeren als Web-app (Met Drive-machtigingen)
1. Klik rechtsboven op de blauwe knop **Implementeren** (Deploy) -> **Nieuwe implementatie** (New deployment).
2. Klik op het **tandwiel-icoon** en selecteer **Web-app**.
3. Configureer de velden exact als volgt:
   - **Uitvoeren als** (Execute as): Kies **Mijzelf** (`Me` - uw eigen e-mailadres)
   - **Wie heeft toegang** (Who has access): Kies **Iedereen** (`Anyone` - cruciaal om verzoeken vanaf de browser toe te staan)
4. Klik op **Implementeren** (Deploy).
5. Er verschijnt nu een autorisatie-dialoogvenster waarin Google vraagt om toegang tot uw Google Drive bestanden (omdat het script bestanden moet kunnen maken en lezen).
6. Klik op **Toegang verlenen** (Review Permissions), selecteer uw Google-account, klik op **Geavanceerd** (Advanced) -> **Ga naar ... (onveilig)** en klik vervolgens op **Toestaan** (Allow).
7. Zodra de implementatie klaar is, kopieert u de **Web-app-URL** die eindigt op `/exec`.

---

## 💻 Hoe u het CMS activeert en gebruikt

### 1. Eerste keer openen (Mock Mode)
Open het bestand `drive-cms/index.html` lokaal in uw browser. De app start op in Mock-modus (u ziet een gele banner bovenaan). U kunt hier direct lokaal bestanden aanmaken en testen in het browsergeheugen.

### 2. Live koppelen
1. Klik rechtsboven op het **Instellingen-icoon** (het tandwiel ⚙️).
2. Plak uw gekopieerde **Web-app URL** in het invoerveld en klik op **Instellingen Opslaan**.
3. De gele banner verdwijnt. 

### 3. Automatische map-creatie
Zodra de koppeling actief is, zoekt het script in uw Google Drive-map `agytest` naar een submap genaamd `agytest_cms_files`. 
*   Als deze map er nog niet is, **maakt het script deze automatisch voor u aan**.
*   Wanneer u via de beheerder-pagina in het CMS een nieuw item toevoegt en opslaat, wordt er direct een bestand genaamd `[UNIEKE_ID]__[ARTIKELNAAM].md` aangemaakt in die map.

### 4. Direct beheer in Google Drive
Omdat de artikelen als gewone bestanden in Drive staan, kunt u:
*   De bestanden direct in Google Drive openen en de tekst bewerken.
*   Bestanden handmatig hernoemen. Let er wel op dat u de structuur `[ID]__[NAAM].md` intact laat (bijv. de `__` moet blijven staan).
*   Bestanden die u niet meer nodig heeft, direct in Google Drive naar de prullenbak verplaatsen. Het CMS synchroniseert hier direct mee!

/**
 * Google Apps Script API voor het Google Drive Folder CMS.
 * Sla dit script op in de Apps Script-editor gekoppeld aan een nieuwe Google Sheet (bijv. "Drive CMS Bridge") in uw drive map.
 * Implementeer het script daarna als een "Web App" (Uitvoeren als: Ik, Toegang: Iedereen).
 */

function doGet(e) {
  var folderId = getTargetFolderId();
  if (!folderId) {
    return createJsonResponse({ 
      success: false, 
      error: "Google Drive-map 'agytest_cms_files' kon niet worden gevonden of aangemaakt." 
    });
  }
  
  var folder = DriveApp.getFolderById(folderId);
  var action = e.parameter.action;
  
  if (action === "readList") {
    return handleReadList(folder);
  } else if (action === "readContent") {
    return handleReadContent(folder, e.parameter.id);
  }
  
  return createJsonResponse({ 
    success: false, 
    error: "Ongeldige actie of ontbrekende parameter in GET verzoek." 
  });
}

function doPost(e) {
  var folderId = getTargetFolderId();
  if (!folderId) {
    return createJsonResponse({ 
      success: false, 
      error: "Google Drive-map kon niet worden gevonden of aangemaakt." 
    });
  }
  
  var folder = DriveApp.getFolderById(folderId);
  var postData;
  
  try {
    postData = JSON.parse(e.postData.contents);
  } catch (err) {
    return createJsonResponse({ 
      success: false, 
      error: "Ongeldig JSON-formaat in POST body: " + err.toString() 
    });
  }
  
  var action = postData.action;
  var payload = postData.payload;
  
  if (action === "create") {
    return handleCreate(folder, payload);
  } else if (action === "update") {
    return handleUpdate(folder, payload);
  } else if (action === "delete") {
    return handleDelete(folder, payload);
  }
  
  return createJsonResponse({ 
    success: false, 
    error: "Onbekende actie: " + action 
  });
}

/**
 * Zoekt de specifieke map 'agytest_cms_files' in de drive.
 * Indien niet aanwezig, wordt deze aangemaakt binnen de map 'agytest', of in de root van Google Drive.
 */
function getTargetFolderId() {
  var folders = DriveApp.getFoldersByName("agytest_cms_files");
  if (folders.hasNext()) {
    return folders.next().getId();
  }
  
  // Zoek naar de bovenliggende map 'agytest'
  var parentFolders = DriveApp.getFoldersByName("agytest");
  var parentFolder = parentFolders.hasNext() ? parentFolders.next() : DriveApp.getRootFolder();
  
  // Maak de submap aan
  var newFolder = parentFolder.createFolder("agytest_cms_files");
  return newFolder.getId();
}

/**
 * Haalt de indexlijst op van alle bestanden uit de map.
 * Extraheert de ID en Naam uit de bestandsnaam (ID__naam.md) zonder de bestanden te hoeven openen.
 */
function handleReadList(folder) {
  var data = [];
  var files = folder.getFiles();
  
  while (files.hasNext()) {
    var file = files.next();
    var filename = file.getName();
    
    // Controleer of het bestand voldoet aan ons formaat: ID__naam.md
    if (filename.indexOf("__") !== -1 && filename.endsWith(".md")) {
      // Verwijder de .md extensie
      var nameWithoutExt = filename.substring(0, filename.length - 3);
      var parts = nameWithoutExt.split("__");
      var id = parts[0];
      
      // Voeg de rest weer samen voor het geval de titel underscores bevat
      var naam = parts.slice(1).join("__");
      
      data.push({
        id: id,
        naam: naam,
        fileId: file.getId()
      });
    }
  }
  
  // Sorteer de items chronologisch/alfabetisch op ID (die begint met een timestamp)
  data.sort(function(a, b) {
    return a.id.localeCompare(b.id);
  });
  
  return createJsonResponse({ success: true, data: data });
}

/**
 * Leest de daadwerkelijke Markdown-inhoud van een specifiek bestand op basis van ID.
 */
function handleReadContent(folder, id) {
  if (!id) {
    return createJsonResponse({ success: false, error: "ID parameter is verplicht." });
  }
  
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var filename = file.getName();
    
    // Controleer of de bestandsnaam begint met het opgegeven ID
    if (filename.startsWith(id + "__") && filename.endsWith(".md")) {
      var content = file.getAs("text/plain").getDataAsString();
      var nameWithoutExt = filename.substring(0, filename.length - 3);
      var parts = nameWithoutExt.split("__");
      var naam = parts.slice(1).join("__");
      
      return createJsonResponse({ 
        success: true, 
        data: {
          id: id,
          naam: naam,
          inhoud: content
        } 
      });
    }
  }
  
  return createJsonResponse({ 
    success: false, 
    error: "Bestand met ID " + id + " kon niet worden gevonden." 
  });
}

/**
 * Maakt een nieuw Markdown-bestand aan in de Drive-map.
 */
function handleCreate(folder, payload) {
  if (!payload || !payload.naam) {
    return createJsonResponse({ success: false, error: "Naam is verplicht." });
  }
  
  // Genereer een unieke ID
  var id = "id_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
  var sanitizedNaam = sanitizeFilename(payload.naam);
  var filename = id + "__" + sanitizedNaam + ".md";
  var content = payload.inhoud || "";
  
  var file = folder.createFile(filename, content, MimeType.PLAIN_TEXT);
  
  return createJsonResponse({ 
    success: true, 
    data: { id: id, naam: payload.naam, fileId: file.getId() } 
  });
}

/**
 * Bewerk de bestandsnaam (indien de naam is gewijzigd) en/of de inhoud van het bestand.
 */
function handleUpdate(folder, payload) {
  if (!payload || !payload.id) {
    return createJsonResponse({ success: false, error: "ID is verplicht voor bijwerken." });
  }
  
  var id = payload.id;
  var files = folder.getFiles();
  
  while (files.hasNext()) {
    var file = files.next();
    var filename = file.getName();
    
    if (filename.startsWith(id + "__") && filename.endsWith(".md")) {
      var sanitizedNaam = sanitizeFilename(payload.naam);
      var newFilename = id + "__" + sanitizedNaam + ".md";
      
      // Als de naam gewijzigd is, hernoem het bestand
      if (filename !== newFilename) {
        file.setName(newFilename);
      }
      
      // Update de inhoud
      file.setContent(payload.inhoud || "");
      
      return createJsonResponse({ 
        success: true, 
        data: { id: id, naam: payload.naam } 
      });
    }
  }
  
  return createJsonResponse({ 
    success: false, 
    error: "Bestand met ID " + id + " kon niet worden gevonden." 
  });
}

/**
 * Verplaatst het bestand naar de prullenbak van Google Drive (geen definitieve verwijdering).
 */
function handleDelete(folder, payload) {
  if (!payload || !payload.id) {
    return createJsonResponse({ success: false, error: "ID is verplicht voor verwijderen." });
  }
  
  var id = payload.id;
  var files = folder.getFiles();
  
  while (files.hasNext()) {
    var file = files.next();
    var filename = file.getName();
    
    if (filename.startsWith(id + "__") && filename.endsWith(".md")) {
      file.setTrashed(true); // Naar de prullenbak
      return createJsonResponse({ 
        success: true, 
        message: "Bestand succesvol verplaatst naar de prullenbak in Google Drive." 
      });
    }
  }
  
  return createJsonResponse({ 
    success: false, 
    error: "Bestand met ID " + id + " kon niet worden gevonden." 
  });
}

/**
 * Vervangt tekens die ongeldig zijn in bestandsnamen of die de split logic verstoren.
 */
function sanitizeFilename(name) {
  return name.replace(/[\\/:*?"<>|__]/g, "-");
}

/**
 * Stuur een JSON response terug met CORS-compatibiliteit.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Google Apps Script API voor het CMS.
 * Sla dit script op in de Apps Script-editor gekoppeld aan uw Google Sheet.
 * Implementeer het script daarna als een "Web App" (Uitvoeren als: Ik, Toegang: Iedereen).
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var action = e.parameter.action;
  
  if (action === "readAll") {
    return handleReadAll(sheet);
  }
  
  return createJsonResponse({ 
    success: false, 
    error: "Ongeldige actie of ontbrekende parameter in GET verzoek." 
  });
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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
    return handleCreate(sheet, payload);
  } else if (action === "update") {
    return handleUpdate(sheet, payload);
  } else if (action === "delete") {
    return handleDelete(sheet, payload);
  }
  
  return createJsonResponse({ 
    success: false, 
    error: "Onbekende actie: " + action 
  });
}

/**
 * Haalt alle records op uit de sheet.
 */
function handleReadAll(sheet) {
  var data = [];
  var rows = sheet.getDataRange().getValues();
  
  // Controleer of er data is (rij 1 bevat de koppen: ID, naam, inhoud)
  if (rows.length > 1) {
    for (var i = 1; i < rows.length; i++) {
      data.push({
        id: rows[i][0].toString(),
        naam: rows[i][1] ? rows[i][1].toString() : "",
        inhoud: rows[i][2] ? rows[i][2].toString() : ""
      });
    }
  }
  
  return createJsonResponse({ success: true, data: data });
}

/**
 * Voegt een nieuw record toe aan de sheet met een unieke ID.
 */
function handleCreate(sheet, payload) {
  if (!payload || !payload.naam) {
    return createJsonResponse({ success: false, error: "Naam is verplicht." });
  }
  
  // Genereer een unieke ID gebaseerd op timestamp en een willekeurig getal
  var id = "id_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
  var naam = payload.naam;
  var inhoud = payload.inhoud || "";
  
  // Rij toevoegen: ID (A), naam (B), inhoud (C)
  sheet.appendRow([id, naam, inhoud]);
  
  return createJsonResponse({ 
    success: true, 
    data: { id: id, naam: naam, inhoud: inhoud } 
  });
}

/**
 * Bewerkt een bestaand record in de sheet.
 */
function handleUpdate(sheet, payload) {
  if (!payload || !payload.id) {
    return createJsonResponse({ success: false, error: "ID is verplicht voor bewerken." });
  }
  
  var id = payload.id;
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === id.toString()) {
      // Rij-index in Apps Script is 1-based, en rij 1 is de header, dus i + 1
      sheet.getRange(i + 1, 2).setValue(payload.naam);
      sheet.getRange(i + 1, 3).setValue(payload.inhoud || "");
      
      return createJsonResponse({ success: true, data: payload });
    }
  }
  
  return createJsonResponse({ success: false, error: "Item met ID " + id + " niet gevonden." });
}

/**
 * Verwijdert een record uit de sheet.
 */
function handleDelete(sheet, payload) {
  if (!payload || !payload.id) {
    return createJsonResponse({ success: false, error: "ID is verplicht voor verwijderen." });
  }
  
  var id = payload.id;
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ 
        success: true, 
        message: "Item succesvol verwijderd uit Google Sheets." 
      });
    }
  }
  
  return createJsonResponse({ success: false, error: "Item met ID " + id + " niet gevonden." });
}

/**
 * Helper om een correcte JSON response terug te sturen met CORS headers.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

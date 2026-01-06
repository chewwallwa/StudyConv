/**
 * @name generateFullSchedule
 * @description V18: Surgical Approach + Tagging (Lookup).
 */
function generateFullSchedule() {
  const generator = new ScheduleGenerator();
  generator.run();
}

/**
 * Creates the menu automatically upon opening the spreadsheet.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📅 Schedule')
      .addItem('🔄 Update Schedule', 'generateFullSchedule')
      .addToUi();
}

// ============================================ %
//                                              PART: CLASS DEFINITION
// ============================================ %

class ScheduleGenerator {

  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
    this.sheetMain = this.ss.getSheetByName("main");
    
    // Tags sheet (Lookup Table)
    // Renamed from 'categorias' to 'tags'
    this.sheetTags = this.ss.getSheetByName("tags");

    if (!this.sheetMain) throw new Error("'main' sheet not found!");
    
    // Creates target sheet (linear_data)
    this.sheetTarget = this.ss.getSheetByName("linear_data");
    if (!this.sheetTarget) {
      this.sheetTarget = this.ss.insertSheet("linear_data");
    } else {
      this.sheetTarget.clear();
    }
  }

  // function self = run(self)
  run() {
    // section _______________________________________________________
    // 0. LOAD TAGS (Lookup Map)
    
    console.log(`[INIT] Loading tags map...`);
    const tagsMap = this.loadTagsMap();

    // section _______________________________________________________
    // 1. BLOCK MAPPING (Light Reading)
    
    const lastRow = this.sheetMain.getLastRow();
    console.log(`[MAP] Mapping blocks in ${lastRow} rows (reading only I:L)...`);
    
    // Reads ONLY definition columns (I, J, K, L) -> Indices 8, 9, 10, 11
    const metaData = this.sheetMain.getRange(1, 9, lastRow, 4).getDisplayValues();
    
    let blocksFound = [];

    // Identifies where each block starts
    for (let i = 0; i < metaData.length; i++) {
      const row = metaData[i];
      const rawStart = row[2]; // Column K
      
      // Validation: Must have forward slash "/" and previous column must have text
      if (rawStart && String(rawStart).includes("/") && row[1] !== "") {
        blocksFound.push({
          rowIndex: i, // Row index (base 0)
          curso: row[0],
          bloco: row[1],
          inicio: rawStart,
          fim: row[3]
        });
      }
    }

    console.log(`[MAP] ${blocksFound.length} blocks identified.`);
    
    // Updated header with "Tags"
    let finalData = [["Nome", "Bloco", "Data", "Dia_Semana", "Hora", "Atividade", "Tags"]];
    
    // section _______________________________________________________
    // 2. SURGICAL PROCESSING (Block by Block)

    let scheduleMap = new Map();

    for (let b = 0; b < blocksFound.length; b++) {
      const meta = blocksFound[b];
      
      // -- Parse Dates --
      const startDate = this.parseDateNoon(meta.inicio);
      const endDate = this.parseDateNoon(meta.fim);
      
      if (!startDate || !endDate) continue;
      
      // New Year Correction
      if (endDate < startDate) endDate.setFullYear(endDate.getFullYear() + 1);

      // -- SPECIFIC GRID READING --
      const startRow = meta.rowIndex + 1;
      const safeHeight = Math.min(30, lastRow - startRow + 1); 
      
      if (safeHeight < 1) continue;

      const localGrid = this.sheetMain.getRange(startRow, 1, safeHeight, 8).getDisplayValues();

      // -- Processes the captured grid injecting the tags map --
      this.processGridIntoMap(scheduleMap, meta.curso, meta.bloco, startDate, endDate, localGrid, tagsMap);
      
      if (b % 20 === 0) SpreadsheetApp.flush();
    }

    // section _______________________________________________________
    // 3. CONSOLIDATION AND WRITING

    const outputMatrix = Array.from(scheduleMap.values());
    
    if (outputMatrix.length === 0) {
      console.warn("No data generated.");
      return;
    }

    console.log(`[SORT] Sorting ${outputMatrix.length} records...`);
    // Sorts by date (index 2 of values array)
    outputMatrix.sort((a, b) => a[2].getTime() - b[2].getTime());

    const fullSet = [finalData[0], ...outputMatrix];

    this.writeToSheetBatched(fullSet);
  }

  // subsection------------------------------------------------------
  // Helper Methods
  // ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨ ¨

  /**
   * Reads the 'tags' sheet and returns a normalized Map (lowercase -> tag)
   */
  loadTagsMap() {
    const map = new Map();
    if (!this.sheetTags) return map; // Returns empty if no sheet

    const lastRow = this.sheetTags.getLastRow();
    if (lastRow < 2) return map; // No data

    // Reads Column A (Activity) and B (Tag)
    const data = this.sheetTags.getRange(2, 1, lastRow - 1, 2).getDisplayValues();

    for (let r of data) {
      const activity = r[0];
      const tag = r[1];
      if (activity) {
        // Lowercase key to ensure case-insensitive match
        map.set(String(activity).trim().toLowerCase(), String(tag).trim());
      }
    }
    return map;
  }

  processGridIntoMap(map, curso, bloco, inicio, fim, grid, tagsMap) {
    // Date Loop
    for (let d = new Date(inicio.getTime()); d <= fim; d.setDate(d.getDate() + 1)) {
      const currDate = new Date(d);
      const dayIndex = currDate.getDay(); 
      const colIndex = dayIndex + 1;      

      // Grid Loop (Rows)
      for (let i = 0; i < grid.length; i++) {
        const row = grid[i];
        const hora = row[0]; 

        if (!hora || hora === "") continue; 
        if (String(hora).toLowerCase() === "hora") continue;

        const atividadeRaw = row[colIndex];

        if (atividadeRaw && atividadeRaw.trim() !== "") {
          const atividade = String(atividadeRaw).trim();
          const strDate = this.formatBr(currDate);
          const strHour = String(hora).trim();
          const uniqueKey = `${strDate}_${strHour}`;

          // -- TAG LOGIC --
          // Search in map (lowercase). If not found, default: "other"
          const tagKey = atividade.toLowerCase();
          const tag = tagsMap.has(tagKey) ? tagsMap.get(tagKey) : "other";

          // Final array with the new Tags column at the end
          map.set(uniqueKey, [
            curso,
            bloco,
            new Date(currDate),
            this.getDayName(dayIndex),
            strHour,
            atividade,
            tag // New column
          ]);
        }
      }
    }
  }

parseDateNoon(dateString) {
    if (!dateString) return null;
    const parts = String(dateString).trim().split('/');
    
    if (parts.length === 3) {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;

      let day, month;

      if (p1 > 12) {
        month = p0 - 1; // JS conta meses de 0 a 11
        day = p1;
      } else {
        day = p0;
        month = p1 - 1;
      }

      return new Date(year, month, day, 12, 0, 0);
    }
    return null;
  }

  formatBr(date) {
    return Utilities.formatDate(date, "GMT-0300", "dd/MM/yyyy");
  }
  
  getDayName(i) {
    return ["dom", "seg", "ter", "qua", "qui", "sex", "sab"][i];
  }

  writeToSheetBatched(matrix) {
    console.log(`[WRITE] Writing ${matrix.length} rows to linear_data...`);
    const BATCH = 5000;
    
    // Clears old formatting to avoid ghosts
    this.sheetTarget.clear();
    
    for (let i = 0; i < matrix.length; i += BATCH) {
      const chunk = matrix.slice(i, i + BATCH);
      const startRow = i + 1;
      this.sheetTarget.getRange(startRow, 1, chunk.length, chunk[0].length).setValues(chunk);
      SpreadsheetApp.flush();
    }
    
    // Final formatting
    if (matrix.length > 1) {
      this.sheetTarget.getRange("C2:C").setNumberFormat("dd/mm/yyyy");
      this.sheetTarget.getRange("E2:E").setNumberFormat("@"); // Hour as text
      this.sheetTarget.getRange("A1:G1").setFontWeight("bold"); // Header up to G
      this.sheetTarget.setFrozenRows(1);
    }
    console.log("[DONE] Success.");
  }

} // end class

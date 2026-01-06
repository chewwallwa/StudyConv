/**
 * ============================================
 * SETTINGS & CONFIGURATION
 * ============================================
 */
const DEFAULT_CONFIG = {
    sheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8MnyOtNbE6DFycDMIkOZzdLum0E7Gabz96KqP-HKsSxjwidko2eH0dBukNddw4JwSGCovBF1DrSom/pub?gid=857405435&single=true&output=csv',
    topicsSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8MnyOtNbE6DFycDMIkOZzdLum0E7Gabz96KqP-HKsSxjwidko2eH0dBukNddw4JwSGCovBF1DrSom/pub?gid=1522778738&single=true&output=csv',
    methodsSheetUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8MnyOtNbE6DFycDMIkOZzdLum0E7Gabz96KqP-HKsSxjwidko2eH0dBukNddw4JwSGCovBF1DrSom/pub?gid=1005207347&single=true&output=csv'
};

let CONFIG = JSON.parse(localStorage.getItem('appConfig')) || DEFAULT_CONFIG;
const pad = (num) => num.toString().padStart(2, '0');
const elById = (id) => document.getElementById(id);

// === UTILS ===
function normalizeDate(d) {
    if (!d) return '';
    let parts;
    if (d.includes('-')) parts = d.split('-'); 
    else parts = d.split('/');
    if (parts.length === 3) {
        if (parts[0].length === 4) return `${parseInt(parts[2])}/${parseInt(parts[1])}/${parts[0]}`;
        return `${parseInt(parts[0])}/${parseInt(parts[1])}/${parts[2]}`;
    }
    return d;
}

function parseCSV(text) {
    const rows=[]; let r=[], c='', q=false;
    for(let i=0;i<text.length;i++){
        const ch=text[i], n=text[i+1];
        if(ch==='"'){ if(q && n==='"'){ c+='"'; i++; }else{ q=!q; } }
        else if(ch===',' && !q){ r.push(c.trim()); c=''; }
        else if((ch==='\r'||ch==='\n') && !q){ if(c||r.length>0)r.push(c.trim()); if(r.length>0)rows.push(r); r=[]; c=''; if(ch==='\r'&&n==='\n')i++; }
        else{ c+=ch; }
    }
    if(c||r.length>0){ r.push(c.trim()); rows.push(r); }
    return rows;
}

function toggleSidebar(side) {
    const id = side === 'left' ? 'sb-left' : 'sb-right';
    const el = document.getElementById(id);
    
    if (el) {
        el.classList.toggle('open');
        
        // Se abriu esta, fecha a outra para não ficar uma em cima da outra
        const otherId = side === 'left' ? 'sb-right' : 'sb-left';
        const otherEl = document.getElementById(otherId);
        if(otherEl) otherEl.classList.remove('open');
    } else {
        console.error("ERRO: ID não encontrado no HTML: " + id);
    }
}

// Fechar sidebar ao clicar no botão de navegação (Melhor UX)
document.addEventListener('DOMContentLoaded', () => {
    // ... seus inits normais ...
    
    // NOVO: Fecha o menu se clicar em qualquer botão de navegação
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar').forEach(s => s.classList.remove('open'));
        });
    });
});

// === SOUND SYSTEM ===
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playNotificationSound() {
    initAudio(); if (!audioCtx) return;
    const playTone = (freq, start, duration) => {
        const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'square'; osc.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
        osc.start(audioCtx.currentTime + start); osc.stop(audioCtx.currentTime + start + duration);
    };
    playTone(880, 0, 0.1); playTone(880, 0.15, 0.1);
}

/**
 * ============================================
 * MANAGERS
 * ============================================
 */
class SettingsManager {
    constructor() {
        this.overlay = document.getElementById('settings-overlay');
        this.btnOpen = document.getElementById('btn-settings');
        this.btnSave = document.getElementById('btn-save-settings');
        this.btnClose = document.getElementById('btn-close-settings');
        this.inpSheet = document.getElementById('cfg-sheet-url');
        this.inpTopics = document.getElementById('cfg-topics-url');
        this.inpMethods = document.getElementById('cfg-methods-url');
        this.initEvents();
    }
    initEvents() {
        if(this.btnOpen) this.btnOpen.addEventListener('click', () => {
            this.inpSheet.value = CONFIG.sheetUrl;
            this.inpTopics.value = CONFIG.topicsSheetUrl;
            this.inpMethods.value = CONFIG.methodsSheetUrl;
            this.overlay.classList.remove('hidden');
        });
        if(this.btnClose) this.btnClose.addEventListener('click', () => this.overlay.classList.add('hidden'));
        if(this.btnSave) this.btnSave.addEventListener('click', () => {
            CONFIG.sheetUrl = this.inpSheet.value;
            CONFIG.topicsSheetUrl = this.inpTopics.value;
            CONFIG.methodsSheetUrl = this.inpMethods.value;
            localStorage.setItem('appConfig', JSON.stringify(CONFIG));
            location.reload();
        });
    }
}

class ThemeManager {
    constructor() {
        this.btn = document.getElementById('btn-theme-toggle');
        this.theme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
        if(this.btn) {
            this.btn.addEventListener('click', () => {
                this.theme = this.theme === 'light' ? 'dark' : 'light';
                localStorage.setItem('theme', this.theme);
                this.applyTheme();
            });
        }
    }
    applyTheme() {
        document.body.setAttribute('data-theme', this.theme);
        if(this.btn) this.btn.innerText = this.theme === 'light' ? '☀' : '☾';
    }
}

class ViewManager {
    constructor() {
        this.views = {
            main: document.getElementById('view-main'),
            pomodoro: document.getElementById('view-pomodoro'),
            timer: document.getElementById('view-timer')
        };
        this.floatingWidget = document.getElementById('floating-widget');
        this.btns = document.querySelectorAll('.nav-btn');
        if(this.floatingWidget) this.floatingWidget.addEventListener('click', () => this.switch('main'));
        
        // Restore last view
        const savedView = localStorage.getItem('currentView') || 'main';
        this.switch(savedView);
    }
    switch(viewName) {
        localStorage.setItem('currentView', viewName);
        Object.keys(this.views).forEach(k => {
            if(!this.views[k]) return;
            if(k === viewName) this.views[k].classList.remove('hidden');
            else this.views[k].classList.add('hidden');
        });
        this.btns.forEach(b => {
            if(b.innerText.toLowerCase() === viewName) b.classList.add('active');
            else b.classList.remove('active');
        });
        if(this.floatingWidget) {
            if(viewName === 'timer' || viewName === 'pomodoro') this.floatingWidget.classList.remove('hidden');
            else this.floatingWidget.classList.add('hidden');
        }
    }
}

class TimerQueue {
    constructor() {
        this.queue = JSON.parse(localStorage.getItem('taskQueue')) || [];
        this.listEl = document.getElementById('timer-queue-list');
        this.globalBtn = document.getElementById('global-queue-btn');
        this.globalReset = document.getElementById('global-reset-btn');
        this.globalClear = document.getElementById('global-clear-btn');
        this.globalRunning = false;
        window.taskQueue = this; 
        
        this.initInputs();
        this.render();
        setInterval(() => this.tick(), 1000);
    }
    initInputs() {
        const btnAdd = document.getElementById('btn-add-task');
        if(btnAdd) btnAdd.addEventListener('click', () => {
            const name = document.getElementById('task-name').value || 'Task';
            const h = parseInt(document.getElementById('task-h').value) || 0;
            const m = parseInt(document.getElementById('task-m').value) || 0;
            const s = parseInt(document.getElementById('task-s').value) || 0;
            const color = document.getElementById('task-color').value;
            const totalSecs = (h*3600) + (m*60) + s;
            if(totalSecs <= 0) return;
            this.queue.push({ id: Date.now(), name, totalSecs, remainingSecs: totalSecs, color });
            this.saveAndRender();
        });
        if(this.globalBtn) this.globalBtn.addEventListener('click', () => { initAudio(); this.globalRunning = !this.globalRunning; this.updateGlobalBtn(); });
        if(this.globalReset) this.globalReset.addEventListener('click', () => {
            this.globalRunning = false; this.updateGlobalBtn();
            this.queue.forEach(t => t.remainingSecs = t.totalSecs);
            this.saveAndRender();
        });
        
        // MODIFICADO: Limpa sem perguntar (sem confirm popup)
        if(this.globalClear) {
            this.globalClear.onclick = () => {
                this.globalRunning = false; 
                this.updateGlobalBtn();
                this.queue = [];
                this.saveAndRender();
            }
        }
        this.updateGlobalBtn();
    }
    updateGlobalBtn() {
        if(!this.globalBtn) return;
        if(this.globalRunning) { this.globalBtn.innerText = "⏸ RUNNING"; this.globalBtn.style.background = "var(--accent-green)"; }
        else { this.globalBtn.innerText = "▶ PAUSED"; this.globalBtn.style.background = "var(--text-muted)"; }
    }
    tick() {
        if(!this.globalRunning) return;
        const current = this.queue.find(t => t.remainingSecs > 0);
        if(current) {
            current.remainingSecs--;
            this.updateItemUI(current);
            if(current.remainingSecs === 0) { playNotificationSound(); this.render(); }
            this.save();
        } else if(this.globalRunning && this.queue.length > 0) {
            this.globalRunning = false; this.updateGlobalBtn(); playNotificationSound();
        }
    }
    delete(id) { this.queue = this.queue.filter(t => t.id !== id); this.saveAndRender(); }
    save() { localStorage.setItem('taskQueue', JSON.stringify(this.queue)); }
    saveAndRender() { this.save(); this.render(); }
    updateItemUI(task) {
        const el = document.getElementById(`task-${task.id}`);
        if(el) {
            const percent = (task.remainingSecs / task.totalSecs) * 100;
            el.querySelector('.task-timer').innerHTML = `${this.format(task.remainingSecs)} <span class="task-total-time">/ ${this.format(task.totalSecs)}</span>`;
            el.querySelector('.task-bar-fill').style.width = `${percent}%`;
        }
    }
    format(s) { return `${pad(Math.floor(s/3600))}:${pad(Math.floor((s%3600)/60))}:${pad(s%60)}`; }
    render() {
        if(!this.listEl) return;
        this.listEl.innerHTML = this.queue.map((t, idx) => {
            const isActive = t.remainingSecs > 0 && this.queue.findIndex(x => x.remainingSecs > 0) === idx;
            const isDone = t.remainingSecs === 0;
            const percent = (t.remainingSecs / t.totalSecs) * 100;
            return `<div id="task-${t.id}" class="task-item ${isActive ? 'active' : ''}" style="opacity: ${isDone ? 0.5 : 1}"><div class="task-bar-bg"><div class="task-bar-fill" style="width: ${percent}%; background: ${t.color}"></div></div><div class="task-info"><span class="task-name">${t.name}</span><span class="task-timer">${this.format(t.remainingSecs)} <span class="task-total-time">/ ${this.format(t.totalSecs)}</span></span></div><button class="btn-del-task" onclick="window.taskQueue.delete(${t.id})">×</button></div>`;
        }).join('');
    }
}

class NotesManager {
    constructor(elementId, storageKey, heightKey) {
        this.el = document.getElementById(elementId);
        this.storageKey = storageKey;
        this.heightKey = heightKey;
        
        if(!this.el) return;
        
        // Load Data
        this.el.value = localStorage.getItem(this.storageKey) || '';
        const savedHeight = localStorage.getItem(this.heightKey);
        if(savedHeight) this.el.style.height = savedHeight;
        
        // Save Events
        this.el.addEventListener('input', () => this.save());
        this.el.addEventListener('mouseup', () => this.saveHeight());
        window.addEventListener('beforeunload', () => {
            this.save();
            this.saveHeight();
        });
    }

    save() {
        localStorage.setItem(this.storageKey, this.el.value);
    }

    saveHeight() {
        localStorage.setItem(this.heightKey, this.el.style.height);
    }
}

class Topics {
    constructor() {
        this.panel = document.getElementById('topics-panel');
        this.tbody = document.getElementById('topics-body');
        this.pinBtn = document.getElementById('pin-btn');
        this.data = []; this.lastSubject = null;
        this.marks = JSON.parse(localStorage.getItem('studyMarks')) || {};
        this.pinState = parseInt(localStorage.getItem('topicsPinState')) || 0; 
        
        this.initEvents(); 
        this.loadData();
        this.applyPinState();
    }
    initEvents() {
        if(this.pinBtn) this.pinBtn.addEventListener('click', () => { this.cyclePinState(); });
    }
    cyclePinState() {
        this.pinState = (this.pinState + 1) % 3;
        localStorage.setItem('topicsPinState', this.pinState);
        this.applyPinState();
    }
    applyPinState() {
        const body = document.body;
        body.classList.remove('mode-full', 'mode-minimized');
        if(this.pinBtn) this.pinBtn.style.transform = 'none';
        
        if(this.pinState === 0) { 
            if(this.pinBtn) { this.pinBtn.innerText = "📌"; this.pinBtn.style.transform = 'rotate(0deg)'; }
        }
        else if (this.pinState === 1) { 
            body.classList.add('mode-full'); 
            if(this.pinBtn) this.pinBtn.innerText = "🔴"; 
        }
        else if (this.pinState === 2) { 
            body.classList.add('mode-minimized'); 
            if(this.pinBtn) { this.pinBtn.innerText = "📌"; this.pinBtn.style.transform = 'rotate(45deg)'; }
        }
    }
    async loadData() { try { const res = await fetch(CONFIG.topicsSheetUrl); this.parseData(await res.text()); } catch(e){} }
    parseData(csvText) {
        const rows = parseCSV(csvText).slice(1);
        this.data = rows.map(c => {
            const assunto = c[0] || "No Name"; const tec = c[1] || "";
            const id = tec ? `tec-${tec}` : `id-${assunto.replace(/[^a-zA-Z0-9]/g,'')}`;
            return { id, assunto, tec, disciplina: c[2]?c[2].toLowerCase().trim():'general', prof: c[3]||"", site: c[4]||"" };
        });
    }
    toggleMark(id) {
        if(this.marks[id]) delete this.marks[id]; else this.marks[id] = true;
        localStorage.setItem('studyMarks', JSON.stringify(this.marks));
        const row = document.getElementById(`tr-${id}`);
        if(row) this.marks[id] ? row.classList.add('completed') : row.classList.remove('completed');
    }
    renderFor(subject) {
        if(!this.panel) return;
        if(!subject) { this.panel.classList.add('hidden'); return; }
        const norm = subject.toLowerCase().trim();
        if(this.lastSubject === norm && !this.panel.classList.contains('hidden')) return;
        
        const list = this.data.filter(t => t.disciplina === norm);
        if(list.length === 0) { this.panel.classList.add('hidden'); return; }
        
        this.lastSubject = norm; 
        this.panel.classList.remove('hidden'); 
        this.tbody.innerHTML = '';
        list.forEach(t => {
            const checked = !!this.marks[t.id];
            const tr = document.createElement('tr'); tr.id = `tr-${t.id}`; if(checked) tr.classList.add('completed');
            const btnSite = `onclick="window.open('https://www.google.com/search?q=site:${t.site}+${encodeURIComponent(t.assunto)}', '_blank')"`;
            tr.innerHTML = `<td><input type="checkbox" class="topic-check" ${checked?'checked':''} onclick="window.topicsManager.toggleMark('${t.id}')"><span class="topic-name">${t.assunto}</span></td><td>${t.tec}</td><td class="right"><button class="action-btn btn-yt" onclick="window.open('https://www.youtube.com/results?search_query=${encodeURIComponent(t.prof+' '+t.assunto)}','_blank')">▶</button><button class="action-btn btn-site" ${btnSite}>🌐</button><button class="action-btn" onclick="navigator.clipboard.writeText('${t.assunto}')">📋</button></td>`;
            this.tbody.appendChild(tr);
        });
    }
}

class MethodsManager {
    constructor() { this.container = document.getElementById('methods-list'); this.data = []; this.lastSubject = null; this.loadData(); }
    async loadData() { try { const res = await fetch(CONFIG.methodsSheetUrl); this.parseData(await res.text()); } catch(e){} }
    parseData(csvText) { this.data = parseCSV(csvText).slice(1); }
    cleanStr(str) { return str ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : ""; }
    renderFor(subject) {
        if(!this.container) return;
        if(!subject) { this.container.innerHTML = '<p class="loading-text" style="font-size:0.8rem">Waiting for activity...</p>'; return; }
        if(this.data.length === 0) return; 
        const normSubject = this.cleanStr(subject);
        if(this.lastSubject === normSubject) return; this.lastSubject = normSubject;
        const match = this.data.find(col => {
            const sheetSubject = this.cleanStr(col[0]); if (!sheetSubject) return false;
            if (sheetSubject === normSubject) return true;
            if (sheetSubject.length > 3 && normSubject.includes(sheetSubject)) return true;
            if (normSubject.length > 3 && sheetSubject.includes(normSubject)) return true;
            return false;
        });
        if(!match) { this.container.innerHTML = `<div style="text-align:center; padding: 20px; opacity: 0.6;"><p style="font-size:0.8rem">No method for:<br><strong>${subject}</strong></p></div>`; return; }
        const weight = match[1] || "-"; const method = match[3] || ""; const details = match[4] || "";
        this.container.innerHTML = `<div class="method-card"><span class="method-header">${match[0]} | W-${weight}</span><span class="method-body">${method}</span><span class="method-footer">${details}</span></div>`;
    }
}

class Schedule {
    constructor() {
        this.container = document.getElementById('schedule-list');
        this.elHeader = document.getElementById('header-info');
        this.data = [];
        this.allData = []; 
        this.currentInfo = { nome: '...', bloco: '...', tag: 'others', atividade: '' };
        this.currentIndex = -1; 
        this.updateHeaderClock(); 
        this.loadData();
    }
    getCurrentDateStr() {
        const now = new Date();
        const d = now.getDate();
        const m = now.getMonth() + 1;
        const y = now.getFullYear();
        return `${d}/${m}/${y}`;
    }
    findCurrentIndex() {
        if (!this.allData.length) return -1;
        const todayStr = this.getCurrentDateStr();
        const nowH = new Date().getHours();
        return this.allData.findIndex(row => {
            if (row.length < 5) return false;
            const rDate = normalizeDate(row[2]);
            const rTime = parseInt(row[4].split(':')[0]);
            return rDate === todayStr && rTime === nowH;
        });
    }
    getCurrentState() {
        this.currentIndex = this.findCurrentIndex();
        if(this.currentIndex === -1) {
            return { current: { atividade: "Free", tag: "others" }, nextHour: null };
        }
        const curr = this.allData[this.currentIndex];
        const currentObj = { 
            atividade: curr[5], 
            tag: curr[6] ? curr[6].toLowerCase().trim() : 'others' 
        };
        const next = this.allData[this.currentIndex + 1];
        const nextHourObj = next ? { atividade: next[5], tag: next[6] ? next[6].toLowerCase().trim() : 'others' } : null;

        return { current: currentObj, nextHour: nextHourObj };
    }
    async loadData() { try { const res = await fetch(CONFIG.sheetUrl); this.parseAndRender(await res.text()); } catch(e) { if(this.elHeader) this.elHeader.innerText = "OFFLINE"; } }
    
    parseAndRender(txt) {
        const rows = parseCSV(txt).slice(1);
        this.allData = rows;
        const todayStr = this.getCurrentDateStr();
        this.data = []; 
        let found = false;
        for(let c of rows) {
            if(c.length < 6) continue;
            if(normalizeDate(c[2]) !== todayStr) continue;
            const act = c[5]; 
            if(!act) continue;
            found = true; 
            this.data.push({ 
                nome: c[0], bloco: c[1], hora: c[4], 
                atividade: act, tag: c[6] ? c[6].toLowerCase() : 'others' 
            });
        }
        if(found) { 
            this.updateCurrentInfo(this.data[0]); 
            this.renderList(); 
        } else { 
            this.currentInfo = { nome: "OFF", bloco: "--", tag: "others", atividade: "Livre" }; 
            this.container.innerHTML = '<p class="loading-text">No activity today.</p>'; 
        }
        this.updateHeaderClock();
    }
    getNextStudyEvent() {
        this.currentIndex = this.findCurrentIndex();
        if (this.currentIndex === -1 || !this.allData.length) return { time: '00:00', name: 'Wait...', rawDate: null };
        for (let i = this.currentIndex + 1; i < this.allData.length; i++) {
            const row = this.allData[i];
            if (row.length < 7) continue;
            const tag = row[6] ? row[6].toLowerCase().trim() : '';
            if (tag === 'estudo') return { time: row[4], name: row[5], rawDate: row[2] };
        }
        return { time: '00:00', name: 'No upcoming study', rawDate: null };
    }
    updateCurrentInfo(item) { this.currentInfo.nome = item.nome.toUpperCase(); this.currentInfo.bloco = item.bloco.toUpperCase(); this.currentInfo.atividade = item.atividade; }
    renderList() { 
        this.container.innerHTML = this.data.map(i => 
            `<div class="atividade-row">
                <div class="inner-content">
                    <span class="hora">${i.hora}</span>
                    <span class="desc">${i.atividade}</span>
                </div>
            </div>`
        ).join(''); 
        this.updateActiveRow(); 
    }
    updateActiveRow() { 
        const h = new Date().getHours(); 
        this.container.querySelectorAll('.inner-content').forEach((el, i) => { 
            if(this.data[i] && parseInt(this.data[i].hora) === h) { 
                el.classList.add('current'); 
                this.updateCurrentInfo(this.data[i]); 
            } else {
                el.classList.remove('current'); 
            }
        }); 
    }
    updateHeaderClock() { 
        const n = new Date(); 
        const mat = this.currentInfo.atividade || "..."; 
        
        const dateStr = `${pad(n.getDate())}/${pad(n.getMonth()+1)}/${n.getFullYear()}`;
        const timeStr = `${pad(n.getHours())}:${pad(n.getMinutes())}`;

        if(this.elHeader) {
            this.elHeader.innerHTML = `
                <span class="h-desk">${this.currentInfo.nome} • ${this.currentInfo.bloco} • </span>
                <span class="heavy">${mat}</span>
                <span class="h-date"> • ${dateStr}</span>
                <span class="h-desk"> • ${timeStr}</span>
            `; 
        }
    }
}

class PomodoroController {
    constructor(sch, top, meth) {
        this.sch = sch; this.top = top; this.meth = meth;
        this.elDisplay = document.getElementById('time-main');
        this.elBar = document.getElementById('progresso-main');
        this.elSvg = document.querySelector('.timer-svg');
        this.elBtn = document.getElementById('btn-main');
        this.elReset = document.getElementById('btn-reset-main');
        this.elStatus = document.getElementById('status-main');
        
        this.manDisplay = document.getElementById('time-manual');
        this.manBar = document.getElementById('progresso-manual');
        this.manBtn = document.getElementById('btn-manual');
        this.manReset = document.getElementById('btn-reset-manual');
        this.manStatus = document.getElementById('status-manual');
        
        this.floatActivity = document.getElementById('float-activity');
        this.floatTime = document.getElementById('float-time');
        this.floatStatus = document.getElementById('float-status');
        this.floatFill = document.getElementById('float-bar-fill');
        this.elMiniTime = document.getElementById('mini-time');
        this.elMiniStatus = document.getElementById('mini-status');
        this.elLinearFill = document.getElementById('progresso-linear');
        
        // Lógica do Lápis e Notas (MODIFICADO: Carrega estado)
        this.btnEdit = document.getElementById('btn-pomo-edit');
        this.pomoCard = document.getElementById('pomodoro-main');
        this.sideNote = document.getElementById('pomo-side-note');
        
        // Carrega estado de aberto/fechado
        const isNoteOpen = localStorage.getItem('pomoNoteOpen') === 'true';
        if(isNoteOpen && this.pomoCard) {
            this.pomoCard.classList.add('pomo-editing');
        }

        if(this.btnEdit) {
            this.btnEdit.addEventListener('click', () => {
                this.pomoCard.classList.toggle('pomo-editing');
                // Salva estado
                const isOpen = this.pomoCard.classList.contains('pomo-editing');
                localStorage.setItem('pomoNoteOpen', isOpen);
            });
        }
        if(this.sideNote) {
            this.sideNote.value = localStorage.getItem('pomoSideNote') || '';
            this.sideNote.addEventListener('input', () => {
                localStorage.setItem('pomoSideNote', this.sideNote.value);
            });
        }

        this.barLength = this.elBar ? this.elBar.getTotalLength() : 0;
        if(this.elBar) this.elBar.style.strokeDasharray = this.barLength;
        if(this.manBar) this.manBar.style.strokeDasharray = this.barLength;

        this.manual = { on: false, mode: 'focus', left: 25*60, total: 25*60 };
        
        if(this.manBtn) this.manBtn.addEventListener('click', () => this.toggleManual());
        if(this.elBtn) this.elBtn.addEventListener('click', () => this.toggleManual());
        if(this.manReset) this.manReset.addEventListener('click', () => this.resetManual());
        if(this.elReset) this.elReset.addEventListener('click', () => this.resetManual());
        
        setInterval(() => this.tick(), 1000); 
        this.tick();
    }

    tick() {
        this.sch.updateHeaderClock(); 
        this.sch.updateActiveRow();
        const s = this.sch.getCurrentState();
        
        if(s && s.current) {
            const currentActivity = s.current.atividade;
            
            this.top.renderFor(currentActivity);
            this.meth.renderFor(currentActivity);
            
            if(this.floatActivity) this.floatActivity.innerText = currentActivity;

            const rawTag = s.current.tag;
            const tag = String(rawTag || '').toLowerCase().trim();

            if(tag === 'estudo') {
                if(this.elDisplay) this.elDisplay.classList.remove('text-mode');
                if(this.elSvg) this.elSvg.classList.remove('hidden-circle');
                this.autoLogic(s.current, s.nextHour);
            } else {
                if(this.elBtn) this.elBtn.classList.add('hidden');
                if(this.elReset) this.elReset.classList.add('hidden');
                this.freeTimeLogic(currentActivity);
            }
        }
        
        if(this.manual.on) {
            const now = Date.now();
            const secondsLeft = Math.ceil((this.manual.endTime - now) / 1000);
            
            this.manual.left = secondsLeft;

            if(this.manual.left <= 0) {
                this.manual.left = 0; 
                this.manual.on = false; 
                playNotificationSound();
                
                this.manual.mode = this.manual.mode==='focus'?'break':'focus';
                this.readInputs();
                this.manual.left = this.manual.total;
                
                this.updateButtonsText();
            }
        }
        this.updateManualViewUI();
    }

    freeTimeLogic(currentName) {
        if(this.elDisplay) {
            this.elDisplay.innerText = currentName.toUpperCase();
            this.elDisplay.classList.add('text-mode'); 
        }

        const next = this.sch.getNextStudyEvent();
        
        if (next.rawDate) {
            if(this.elStatus) this.elStatus.innerHTML = `Next: ${next.name}<br>at ${next.time}`;
            if(this.elSvg) this.elSvg.classList.remove('hidden-circle');
            if(this.elBar) { 
                this.elBar.style.stroke = 'var(--text-muted)'; 
                this.elBar.style.strokeDashoffset = 0; 
            }
            if(this.floatTime) this.floatTime.innerText = next.time;
            if(this.floatStatus) this.floatStatus.innerText = "NEXT";
        } else {
            if(this.elStatus) this.elStatus.innerHTML = `Next: ...`;
            if(this.floatTime) this.floatTime.innerText = "--:--";
        }
    }

    autoLogic(curr, nextH) {
        const n = new Date();
        const total = n.getMinutes()*60 + n.getSeconds();
        let ph='', dur=0, elapsed=0, col='', lbl='';
        
        const change = nextH && curr && (nextH.atividade !== curr.atividade);
        
        const m = n.getMinutes();
        if(change) {
            if(m<40) { ph='focus'; dur=2400; elapsed=total; col='var(--accent-red)'; lbl='FOCUS'; }
            else if(m<45) { ph='active'; dur=300; elapsed=total-2400; col='var(--accent-yellow)'; lbl='ACTIVE'; }
            else { ph='rest'; dur=900; elapsed=total-2700; col='var(--accent-green)'; lbl='REST'; }
        } else {
            if(m<50) { ph='focus'; dur=3000; elapsed=total; col='var(--accent-red)'; lbl='FOCUS'; }
            else { ph='active'; dur=600; elapsed=total-3000; col='var(--accent-yellow)'; lbl='ACTIVE'; }
        }
        
        let left = Math.max(0, dur - elapsed);
        
        if(left === 0 && dur > 0) playNotificationSound();
        
        this.updateUI(left, dur, col, lbl);
    }

    readInputs() {
        const f = parseInt(document.getElementById('manual-focus-time').value) || 25;
        const r = parseInt(document.getElementById('manual-rest-time').value) || 5;
        this.manual.total = (this.manual.mode === 'focus' ? f : r) * 60;
    }
    toggleManual() {
        initAudio();
        if (this.manual.on) {
            this.manual.on = false;
        } else {
            if (this.manual.left <= 0) {
                this.readInputs(); 
                this.manual.left = this.manual.total;
            }
            this.manual.endTime = Date.now() + (this.manual.left * 1000);
            this.manual.on = true;
        }
        this.updateButtonsText();
    }
    resetManual() {
        this.manual.on = false; this.manual.mode = 'focus';
        this.readInputs(); this.manual.left = this.manual.total;
        this.updateButtonsText(); this.updateManualViewUI();
        const col = this.getManualColor(); const lbl = this.getManualLabel();
        this.updateUI(this.manual.left, this.manual.total, col, lbl);
    }
    updateButtonsText() {
        const txt = this.manual.on ? "PAUSE" : "START";
        const bg = this.manual.on ? "var(--text-muted)" : "var(--accent-red)";
        if(this.manBtn) { this.manBtn.innerText = txt; this.manBtn.style.background = bg; }
        if(this.elBtn) { this.elBtn.innerText = txt; this.elBtn.style.background = bg; }
    }
    getManualColor() { return this.manual.mode === 'focus' ? 'var(--accent-red)' : 'var(--accent-green)'; }
    getManualLabel() { return this.manual.mode === 'focus' ? 'FOCUS' : 'BREAK'; }
    updateUI(left, total, col, lbl) {
        const txt = `${pad(Math.floor(left/60))}:${pad(Math.floor(left%60))}`;
        const percent = total > 0 ? (left/total)*100 : 0;
        if(this.elDisplay) this.elDisplay.innerText = txt;
        if(this.elStatus) this.elStatus.innerText = lbl;
        if(this.elBar) { this.elBar.style.stroke = col; this.elBar.style.strokeDashoffset = this.barLength - (left/total)*this.barLength; }
        if(this.elMiniTime) this.elMiniTime.innerText = txt;
        if(this.elMiniStatus) { this.elMiniStatus.innerText = lbl; this.elMiniStatus.style.color = col; }
        if(this.elLinearFill) { this.elLinearFill.style.backgroundColor = col; this.elLinearFill.style.width = `${percent}%`; }
        if(this.floatTime) this.floatTime.innerText = txt;
        if(this.floatStatus) { this.floatStatus.innerText = lbl; this.floatStatus.style.color = col; }
        if(this.floatFill) { this.floatFill.style.backgroundColor = col; this.floatFill.style.width = `${percent}%`; }
        document.title = `${txt} - ${lbl}`;
    }
    updateManualViewUI() {
        const col = this.getManualColor(); const lbl = this.getManualLabel();
        const txt = `${pad(Math.floor(this.manual.left/60))}:${pad(Math.floor(this.manual.left%60))}`;
        if(this.manDisplay) this.manDisplay.innerText = txt;
        if(this.manStatus) this.manStatus.innerText = lbl;
        if(this.manBar) { this.manBar.style.stroke = col; this.manBar.style.strokeDashoffset = this.barLength - (this.manual.left/this.manual.total)*this.barLength; }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.viewManager = new ViewManager();
    window.settingsManager = new SettingsManager();
    window.themeManager = new ThemeManager();
    window.timerQueue = new TimerQueue();
    window.topicsManager = new Topics();
    // Inicia notas com as chaves corretas e IDs atualizados
    new NotesManager('notes-area-left', 'userNotesLeft', 'notesHeightLeft');
    new NotesManager('notes-area-right', 'userNotesRight', 'notesHeightRight');
    
    const meth = new MethodsManager();
    const sch = new Schedule();
    const pom = new PomodoroController(sch, window.topicsManager, meth);

});

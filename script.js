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
 * Manages the Settings Modal, LocalStorage persistence,
 * and Cloud Synchronization (Google Drive).
 */
class SettingsManager {
    constructor() {
        // Elementos da UI
        this.overlay = document.getElementById('settings-overlay');
        this.btnOpen = document.getElementById('btn-settings');
        this.btnClose = document.getElementById('btn-close-settings');
        this.btnSave = document.getElementById('btn-save-settings');

        // Inputs do Google Sheet
        this.inpSheet = document.getElementById('cfg-sheet-url');
        this.inpTopics = document.getElementById('cfg-topics-url');
        this.inpMethods = document.getElementById('cfg-methods-url');

        // Telegram
        this.inpTgToken = document.getElementById('cfg-tg-token');
        this.inpTgId = document.getElementById('cfg-tg-id');

        // Nuvem (Drive)
        this.inpCloudUrl = document.getElementById('cfg-cloud-url');
        this.inpCloudKey = document.getElementById('cfg-cloud-key');
        this.btnCloudSave = document.getElementById('btn-cloud-save');
        this.btnCloudLoad = document.getElementById('btn-cloud-load');
        this.statusCloud = document.getElementById('cloud-status');

        // Manual
        this.btnExport = document.getElementById('btn-export');
        this.btnImport = document.getElementById('btn-import');

        this.initEvents();

        // Auto-Save a cada 5 minutos
        setInterval(() => this.autoCloudSave(), 5 * 60 * 1000);
    }

    initEvents() {
        // ABRIR
        this.btnOpen.addEventListener('click', () => {
            // Preenche os campos com o que está na memória
            this.inpSheet.value = localStorage.getItem('cfgSheetUrl') || CONFIG.sheetUrl || '';
            this.inpTopics.value = localStorage.getItem('cfgTopicsUrl') || CONFIG.topicsSheetUrl || '';
            this.inpMethods.value = localStorage.getItem('cfgMethodsUrl') || CONFIG.methodsSheetUrl || '';

            this.inpTgToken.value = localStorage.getItem('cfgTgToken') || '';
            this.inpTgId.value = localStorage.getItem('cfgTgId') || '';

            this.inpCloudUrl.value = localStorage.getItem('cfgCloudUrl') || '';
            this.inpCloudKey.value = localStorage.getItem('cfgCloudKey') || '';

            this.overlay.classList.remove('hidden');
        });

        this.btnClose.addEventListener('click', () => this.overlay.classList.add('hidden'));

        // SALVAR GERAL
        this.btnSave.addEventListener('click', async () => {
            localStorage.setItem('cfgSheetUrl', this.inpSheet.value);
            localStorage.setItem('cfgTopicsUrl', this.inpTopics.value);
            localStorage.setItem('cfgMethodsUrl', this.inpMethods.value);

            // Atualiza config global
            if (typeof CONFIG !== 'undefined') {
                CONFIG.sheetUrl = this.inpSheet.value;
                CONFIG.topicsSheetUrl = this.inpTopics.value;
                CONFIG.methodsSheetUrl = this.inpMethods.value;
                localStorage.setItem('appConfig', JSON.stringify(CONFIG));
            }

            localStorage.setItem('cfgTgToken', this.inpTgToken.value);
            localStorage.setItem('cfgTgId', this.inpTgId.value);

            const cloudUrl = this.inpCloudUrl.value;
            const cloudKey = this.inpCloudKey.value;
            localStorage.setItem('cfgCloudUrl', cloudUrl);
            localStorage.setItem('cfgCloudKey', cloudKey);

            // Pergunta se quer baixar os dados da nuvem agora
            if (cloudUrl && cloudKey) {
                if (confirm("Settings salvas! Deseja BAIXAR os dados da nuvem agora para sincronizar?")) {
                    await this.performCloudDownload(cloudUrl, cloudKey);
                } else {
                    // Se não baixar, sobe o que tem agora pra garantir
                    await this.performCloudUpload(cloudUrl, cloudKey, true);
                    location.reload();
                }
            } else {
                location.reload();
            }
        });

        // BOTÕES DA NUVEM
        this.btnCloudSave.addEventListener('click', () => {
            this.performCloudUpload(this.inpCloudUrl.value, this.inpCloudKey.value, false);
        });

        this.btnCloudLoad.addEventListener('click', () => {
            if(confirm("ATENÇÃO: Isso substituirá TUDO neste dispositivo pelos dados da nuvem. Continuar?")) {
                this.performCloudDownload(this.inpCloudUrl.value, this.inpCloudKey.value);
            }
        });

        // BOTÕES MANUAIS
        this.btnExport.addEventListener('click', () => {
            const data = this.gatherData();
            const encoded = btoa(JSON.stringify(data));
            navigator.clipboard.writeText(encoded).then(() => alert("Código de backup copiado!"));
        });

        this.btnImport.addEventListener('click', () => {
            const code = prompt("Cole o código aqui:");
            if(code) {
                if(this.restoreData(code, true)) {
                    location.reload();
                }
            }
        });
    }

    // ============================================================
    // ESTRATÉGIA DE ESPELHO (MIRROR)
    // ============================================================

    gatherData() {
        // Pega TUDO do localStorage
        const allData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            allData[key] = localStorage.getItem(key);
        }

        // Logs de verificação para você ver no console (F12)
        if(allData['timerTabsSystem']) console.log("✅ Abas do Timer incluídas no backup.");
        else console.warn("⚠️ Abas do Timer vazias ou não encontradas.");

        if(allData['userNotesLeft']) console.log("✅ Nota Esquerda incluída.");
        if(allData['userNotesRight']) console.log("✅ Nota Direita incluída.");

        return {
            mirror: allData, // Salva cópia exata
            timestamp: new Date().getTime()
        };
    }

    restoreData(inputData, isEncoded = false) {
        try {
            let data = inputData;

            if (!data) throw new Error("Dados vazios.");

            if (isEncoded) {
                try { data = JSON.parse(atob(inputData.trim())); }
                catch (err) { throw new Error("Falha ao decodificar Base64."); }
            }

            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch(e) {}
            }

            if (typeof data !== 'object') throw new Error("Formato inválido.");

            // --- RESTAURAÇÃO UNIVERSAL ---
            if (data.mirror) {
                console.log("[Restore] Restaurando espelho completo...");
                const store = data.mirror;

                // Limpa antes de restaurar pra não sobrar lixo antigo
                // Mas guarda as chaves de config do script pra não perder conexão
                const safeKeys = ['cfgCloudUrl', 'cfgCloudKey'];
                const safeValues = {};
                safeKeys.forEach(k => safeValues[k] = localStorage.getItem(k));

                // Restaura
                for (const key in store) {
                    if (store.hasOwnProperty(key)) {
                        localStorage.setItem(key, store[key]);
                    }
                }

                // Garante que a config de nuvem atual prevalece se o backup for velho
                // (Opcional, mas bom pra evitar travar o sync)
                if(safeValues['cfgCloudUrl']) localStorage.setItem('cfgCloudUrl', safeValues['cfgCloudUrl']);

            } else {
                // Suporte legado (Backups antigos)
                console.log("[Restore] Modo Legado...");
                if (data.notes) localStorage.setItem('notesContent', data.notes); // Exemplo antigo
                // Adicione outros manuais se tiver backups muito velhos
            }

            console.log("[Restore] Sucesso!");
            return true;

        } catch (e) {
            console.error(e);
            alert("Erro ao Restaurar: " + e.message);
            return false;
        }
    }

    // ============================================================
    // LÓGICA DE NUVEM
    // ============================================================

    async autoCloudSave() {
        const url = localStorage.getItem('cfgCloudUrl');
        const key = localStorage.getItem('cfgCloudKey');
        if (url && key) {
            console.log("[AutoSave] Salvando...");
            // Silent mode = true
            await this.performCloudUpload(url, key, true);
        }
    }

    async performCloudUpload(url, key, silent = false) {
        if (!url || !key) {
            if(!silent) alert("Configure URL e Senha nas Configurações!");
            return;
        }

        if(!silent) this.btnCloudSave.innerText = "⏳ Enviando...";
        this.statusCloud.innerText = "Syncing...";

        try {
            // Garante que o input atual perdeu foco para salvar o estado
            if (document.activeElement) document.activeElement.blur();

            const fullData = this.gatherData();

            console.log(`[Upload] Enviando ${Object.keys(fullData.mirror).length} chaves.`);

            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify({ key: key, payload: fullData })
            });

            const json = await response.json();

            if (json.status === 'success') {
                const hora = new Date().toLocaleTimeString();
                this.statusCloud.innerText = "Salvo: " + hora;
                if(!silent) alert("✅ Salvo no Drive com Sucesso!");
            } else {
                this.statusCloud.innerText = "Erro ao Salvar";
                if(!silent) alert("Erro: " + json.message);
            }
        } catch (e) {
            console.error(e);
            this.statusCloud.innerText = "Erro Conexão";
            if(!silent) alert("Erro de Conexão. Verifique a URL.");
        } finally {
            if(!silent) this.btnCloudSave.innerText = "⬆️ Force Upload";
        }
    }

    async performCloudDownload(url, key) {
        if (!url || !key) return alert("Configure URL e Senha!");

        this.btnCloudLoad.innerText = "⏳ Baixando...";

        try {
            const response = await fetch(`${url}?key=${encodeURIComponent(key)}`);
            const json = await response.json();

            if (json.status === 'success') {
                if (this.restoreData(json.payload, false)) {
                    alert("🔄 Sincronizado! A página irá recarregar.");
                    location.reload(); // RECARREGA PARA APLICAR AS NOTAS E ABAS
                }
            } else if (json.status === 'empty') {
                alert("⚠️ Nenhum backup encontrado no Drive.");
            } else {
                alert("Erro: " + json.message);
            }
        } catch (e) {
            console.error(e);
            alert("Erro de Conexão.");
        } finally {
            this.btnCloudLoad.innerText = "⬇️ Force Download";
        }
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
        // --- DADOS ---
        const rawData = localStorage.getItem('timerTabsSystem');
        if (rawData) {
            const data = JSON.parse(rawData);
            this.tabs = data.tabs || [];
            this.activeId = data.activeId;
        } else {
            const oldQueue = JSON.parse(localStorage.getItem('taskQueue')) || [];
            this.tabs = [{ id: Date.now(), name: 'Main List', tasks: oldQueue }];
            this.activeId = this.tabs[0].id;
        }

        // --- ELEMENTOS UI ---
        this.listEl = document.getElementById('timer-queue-list');
        this.tabsContainer = document.getElementById('tabs-scroll-area');
        this.btnAddTab = document.getElementById('btn-add-tab');

        // Botões Globais
        this.globalBtn = document.getElementById('global-queue-btn');
        this.globalReset = document.getElementById('global-reset-btn');
        this.globalClear = document.getElementById('global-clear-btn');

        this.globalRunning = false;
        window.taskQueue = this;

        // --- INICIALIZAÇÃO ---
        this.initInputs();
        this.initTabEvents();
        this.initScrollLogic(); // NOVO: Drag Scroll
        this.render();

        // Loop do Timer
        setInterval(() => this.tick(), 1000);
    }

    get activeTab() { return this.tabs.find(t => t.id === this.activeId) || this.tabs[0]; }
    get currentQueue() { return this.activeTab ? this.activeTab.tasks : []; }

    // --- NOVA LÓGICA DE SCROLL (Drag & Wheel) ---
    initScrollLogic() {
        const slider = this.tabsContainer;
        let isDown = false;
        let startX;
        let scrollLeft;

        // 1. Mouse Drag (Arrastar para o lado)
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => { isDown = false; });
        slider.addEventListener('mouseup', () => { isDown = false; });
        slider.addEventListener('mousemove', (e) => {
            if(!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Velocidade do scroll
            slider.scrollLeft = scrollLeft - walk;
        });

        // 2. Mouse Wheel (Rodinha rola horizontalmente)
        slider.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                slider.scrollLeft += e.deltaY;
            }
        });
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

                                           this.activeTab.tasks.push({ id: Date.now(), name, totalSecs, remainingSecs: totalSecs, color });
            this.saveAndRender();
        });

        // Controles Globais
        if(this.globalBtn) this.globalBtn.addEventListener('click', () => {
            initAudio();
            this.globalRunning = !this.globalRunning;
            this.updateGlobalBtn();
        });
        if(this.globalReset) this.globalReset.addEventListener('click', () => {
            this.globalRunning = false; this.updateGlobalBtn();
            this.activeTab.tasks.forEach(t => t.remainingSecs = t.totalSecs);
            this.saveAndRender();
        });
        if(this.globalClear) this.globalClear.onclick = () => {
            this.globalRunning = false; this.updateGlobalBtn();
            this.activeTab.tasks = []; // Limpa direto sem popup
            this.saveAndRender();
        }
        this.updateGlobalBtn();
    }

    initTabEvents() {
        if(this.btnAddTab) {
            this.btnAddTab.addEventListener('click', () => {
                const newId = Date.now();
                this.tabs.push({ id: newId, name: 'New List', tasks: [] });
                this.switchTab(newId);
                // Scrolla para o fim para mostrar a nova aba
                setTimeout(() => {
                    this.tabsContainer.scrollLeft = this.tabsContainer.scrollWidth;
                }, 100);
            });
        }
    }

    // --- LÓGICA DE ABAS ---
    switchTab(id) {
        if(this.activeId === id) return;
        this.activeId = id;
        this.globalRunning = false; // Pausa por segurança
        this.updateGlobalBtn();
        this.saveAndRender();
    }

    deleteTab(e, id) {
        e.stopPropagation(); // Impede trocar de aba ao clicar no X
        if(this.tabs.length <= 1) return; // Não deleta a última, silencioso

        this.tabs = this.tabs.filter(t => t.id !== id);

        if(this.activeId === id) {
            this.activeId = this.tabs[0].id; // Volta pra primeira
            this.globalRunning = false;
            this.updateGlobalBtn();
        }
        this.saveAndRender();
    }

    renameTab(id, newName) {
        const tab = this.tabs.find(t => t.id === id);
        if(tab) {
            tab.name = newName;
            this.save();
        }
    }

    // --- TIMER ENGINE ---
    tick() {
        if(!this.globalRunning) return;

        const queue = this.currentQueue;
        const current = queue.find(t => t.remainingSecs > 0);

        if(current) {
            current.remainingSecs--;
            this.updateItemUI(current);
            if(current.remainingSecs === 0) {
                playNotificationSound();
                this.renderList();
            }
            this.save();
        } else if(queue.length > 0) {
            this.globalRunning = false;
            this.updateGlobalBtn();
            playNotificationSound();
        }
    }

    deleteTask(id) {
        this.activeTab.tasks = this.activeTab.tasks.filter(t => t.id !== id);
        this.saveAndRender();
    }

    // --- SALVAMENTO E UI ---
    save() {
        localStorage.setItem('timerTabsSystem', JSON.stringify({
            activeId: this.activeId,
            tabs: this.tabs
        }));
    }
    saveAndRender() { this.save(); this.render(); }

    updateGlobalBtn() {
        if(!this.globalBtn) return;
        if(this.globalRunning) {
            this.globalBtn.innerText = "⏸ RUNNING";
            this.globalBtn.style.background = "var(--accent-green)";
            this.globalBtn.style.color = "white";
        } else {
            this.globalBtn.innerText = "▶ PAUSED";
            this.globalBtn.style.background = "var(--dim-bg)";
            this.globalBtn.style.color = "var(--text-muted)";
            this.globalBtn.style.border = "1px solid var(--dim-border)";
        }
    }

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
        this.renderTabs();
        this.renderList();
    }

    enableEdit(id) {
        // Acha a aba e o input no DOM
        const tabEl = document.querySelectorAll('.timer-tab');
        const targetTab = Array.from(tabEl).find(el => el.querySelector('input').getAttribute('data-id') == id);

        if (targetTab) {
            targetTab.classList.add('editing');
            const input = targetTab.querySelector('input');
            input.focus();
            input.select(); // Já seleciona o texto todo pra facilitar
        }
    }

    renderTabs() {
        if(!this.tabsContainer) return;

        this.tabsContainer.innerHTML = this.tabs.map(tab => {
            const isActive = tab.id === this.activeId;

            // Lógica:
            // onclick -> Troca de aba
            // ondblclick -> Ativa edição
            // onblur (input) -> Salva e trava o input de novo

            return `
            <div class="timer-tab ${isActive ? 'active' : ''}"
            onclick="window.taskQueue.switchTab(${tab.id})"
            ondblclick="window.taskQueue.enableEdit(${tab.id})">

            <input type="text" class="tab-name-input" value="${tab.name}"
            data-id="${tab.id}"
            onchange="window.taskQueue.renameTab(${tab.id}, this.value)"
            onkeydown="if(event.key==='Enter') this.blur();"
            onblur="this.parentElement.classList.remove('editing')">

            <button class="tab-close-btn" onclick="window.taskQueue.deleteTab(event, ${tab.id})">✕</button>
            </div>
            `;
        }).join('');
    }
    renderList() {
        if(!this.listEl) return;
        const queue = this.currentQueue;
        if (queue.length === 0) {
            this.listEl.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); opacity:0.5; font-size:0.9rem;">Empty List</div>`;
            return;
        }
        this.listEl.innerHTML = queue.map((t, idx) => {
            const isActive = t.remainingSecs > 0 && queue.findIndex(x => x.remainingSecs > 0) === idx;
            const isDone = t.remainingSecs === 0;
            const percent = (t.remainingSecs / t.totalSecs) * 100;

            return `
            <div id="task-${t.id}" class="task-item ${isActive ? 'active' : ''}" style="opacity: ${isDone ? 0.5 : 1}">
            <div class="task-bar-bg"><div class="task-bar-fill" style="width: ${percent}%; background: ${t.color}"></div></div>
            <div class="task-info">
            <span class="task-name">${t.name}</span>
            <span class="task-timer">${this.format(t.remainingSecs)} <span class="task-total-time">/ ${this.format(t.totalSecs)}</span></span>
            </div>
            <button class="btn-del-task" onclick="window.taskQueue.deleteTask(${t.id})">×</button>
            </div>
            `;
        }).join('');
    }
}

class NotesManager {
    constructor(elementId, storageKey) {
        this.el = document.getElementById(elementId);
        this.storageKey = storageKey;
        this.heightKey = storageKey + '_height';

        if(!this.el) return;

        // 1. Carregar Texto Salvo
        const savedText = localStorage.getItem(this.storageKey);
        if(savedText) this.el.value = savedText;

        // 2. Carregar Altura Salva (pra manter o tamanho da caixa)
        const savedHeight = localStorage.getItem(this.heightKey);
        if(savedHeight) this.el.style.height = savedHeight;

        // 3. Eventos de Salvamento (Digitação e Redimensionamento)
        // Salva a cada tecla para garantir que o Sync pegue a versão mais recente
        this.el.addEventListener('input', () => this.save());

        // Salva a altura quando solta o mouse (após redimensionar)
        this.el.addEventListener('mouseup', () => this.saveHeight());
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

        // Elementos de Controle
        this.btnToggle = document.getElementById('btn-week-toggle');
        this.btnToday = document.getElementById('btn-schedule-today');
        this.datePicker = document.getElementById('schedule-date-picker');

        this.data = [];
        this.allData = [];

        this.currentInfo = { nome: '...', bloco: '...', tag: 'others', atividade: '' };
        this.currentIndex = -1;

        this.viewMode = 'single';
        this.targetDateStr = this.getCurrentDateStr();

        this.initEvents();
        this.updateHeaderClock();

        // CORREÇÃO: Usa horário LOCAL, não UTC
        if(this.datePicker) {
            this.datePicker.value = this.getLocalISOString();
        }

        this.loadData();
    }

    // NOVA FUNÇÃO: Gera "YYYY-MM-DD" baseado no seu fuso horário local
    getLocalISOString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    initEvents() {
        // 1. Botão Lista (Toggle)
        if(this.btnToggle) {
            this.btnToggle.addEventListener('click', () => {
                this.viewMode = this.viewMode === 'single' ? 'list' : 'single';
                this.btnToggle.style.color = this.viewMode === 'list' ? 'var(--accent-blue)' : 'var(--text-muted)';
                this.datePicker.style.opacity = this.viewMode === 'list' ? '0.5' : '1';
                this.render();
            });
        }

        // 2. Botão Hoje (Reset)
        if(this.btnToday) {
            this.btnToday.addEventListener('click', () => {
                this.targetDateStr = this.getCurrentDateStr();

                // CORREÇÃO AQUI TAMBÉM
                if(this.datePicker) this.datePicker.value = this.getLocalISOString();

                this.viewMode = 'single';
                this.btnToggle.style.color = 'var(--text-muted)';
                this.datePicker.style.opacity = '1';
                this.render();
            });
        }

        // 3. Date Picker
        if(this.datePicker) {
            this.datePicker.addEventListener('change', (e) => {
                if(!e.target.value) return;
                const parts = e.target.value.split('-');
                this.targetDateStr = `${parseInt(parts[2])}/${parseInt(parts[1])}/${parts[0]}`;

                this.viewMode = 'single';
                this.btnToggle.style.color = 'var(--text-muted)';
                this.datePicker.style.opacity = '1';
                this.render();
            });
        }
    }

    getCurrentDateStr() {
        const now = new Date();
        return `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    }

    parseDateStr(str) {
        if(!str) return null;
        const parts = str.split('/');
        return new Date(parts[2], parts[1]-1, parts[0]);
    }

    getDayName(dateStr) {
        if(!dateStr) return '';
        const date = this.parseDateStr(dateStr);
        if(!date) return '';
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    }

    async loadData() {
        try {
            const res = await fetch(CONFIG.sheetUrl);
            this.parseData(await res.text());
        } catch(e) {
            if(this.elHeader) this.elHeader.innerText = "OFFLINE";
            this.container.innerHTML = '<p class="error-text">Failed to load schedule.</p>';
        }
    }

    parseData(txt) {
        const rows = parseCSV(txt).slice(1);
        this.allData = rows;
        this.render();
        this.checkCurrentActivity();
    }

    checkCurrentActivity() {
        const todayStr = this.getCurrentDateStr();
        const h = new Date().getHours();
        const todayItems = this.allData.filter(c => c.length >= 6 && normalizeDate(c[2]) === todayStr);
        const currentItem = todayItems.find(c => parseInt(c[4].split(':')[0]) === h);

        if(currentItem) {
            this.updateCurrentInfo({
                nome: currentItem[0], bloco: currentItem[1],
                atividade: currentItem[5], tag: currentItem[6]
            });
        } else {
            this.currentInfo = { nome: "OFF", bloco: "--", tag: "others", atividade: "Livre" };
        }
        this.updateHeaderClock();
    }

    compressList(list) {
        if (!list || list.length === 0) return [];
        const compressed = [];
        let currentGroup = null;

        list.forEach(item => {
            const h = typeof item.hora === 'number' ? item.hora : parseInt(item.hora.split(':')[0]);
            if (currentGroup && item.atividade === currentGroup.atividade && item.tag === currentGroup.tag) {
                currentGroup.endH = h + 1; currentGroup.duration++;
            } else {
                if (currentGroup) compressed.push(currentGroup);
                currentGroup = { ...item, startH: h, endH: h + 1, duration: 1 };
            }
        });
        if (currentGroup) compressed.push(currentGroup);
        return compressed;
    }

    render() {
        if (this.viewMode === 'single') {
            this.renderSingleDay();
        } else {
            this.renderFullList();
        }
    }

    renderSingleDay() {
        const dayData = [];
        for(let c of this.allData) {
            if(c.length < 6) continue;
            if(normalizeDate(c[2]) !== this.targetDateStr) continue;
            const act = c[5]; if(!act) continue;
            const hInt = parseInt(c[4].split(':')[0]);
            dayData.push({ nome: c[0], bloco: c[1], hora: hInt, atividade: act, tag: c[6] });
        }

        if(dayData.length === 0) {
            const isToday = this.targetDateStr === this.getCurrentDateStr();
            this.container.innerHTML = `<p class="loading-text">No activity for ${this.targetDateStr} ${isToday ? '(Today)' : ''}</p>`;
            return;
        }

        const displayList = this.compressList(dayData);
        const dayName = this.getDayName(this.targetDateStr);

        let html = `<div class="day-header" style="margin-top:0">${dayName} <span style="font-weight:normal">(${this.targetDateStr})</span></div>`;

        html += displayList.map(i => {
            const timeStr = `${pad(i.startH)}:00`;
            return `
            <div class="atividade-row" data-start="${i.startH}" data-end="${i.endH}" data-date="${this.targetDateStr}">
            <div class="inner-content">
            <span class="hora">${timeStr}</span>
            <span class="desc">${i.atividade}</span>
            </div>
            </div>`;
        }).join('');

        this.container.innerHTML = html;
        this.updateActiveRow();
    }

    renderFullList() {
        const groups = {};
        const todayObj = new Date();
        todayObj.setHours(0,0,0,0);

        const RANGE_DAYS = 35;
        const oneDayMs = 1000 * 60 * 60 * 24;

        this.allData.forEach(row => {
            if(row.length < 6) return;
            const dateStr = normalizeDate(row[2]);
            if(!dateStr) return;

            const rowDateObj = this.parseDateStr(dateStr);
            if (!rowDateObj) return;

            const diffTime = rowDateObj - todayObj;
            const diffDays = diffTime / oneDayMs;

            if (diffDays < -RANGE_DAYS || diffDays > RANGE_DAYS) return;

            if(!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push({ hora: row[4], atividade: row[5], tag: row[6] });
        });

        const uniqueDates = Object.keys(groups);
        uniqueDates.sort((a, b) => this.parseDateStr(a) - this.parseDateStr(b));

        let html = '';
        const todayStr = this.getCurrentDateStr();

        if (uniqueDates.length === 0) {
            html = '<p class="loading-text">No activities found in range (±35 days).</p>';
        }

        uniqueDates.forEach(date => {
            const dayName = this.getDayName(date);
            const isToday = date === todayStr;
            const isTarget = date === this.targetDateStr;

            let items = groups[date];
            items = this.compressList(items);

            const highlightClass = isToday ? 'is-today' : (isTarget ? 'is-target' : '');

            html += `<div class="day-group ${highlightClass}" id="date-${date.replace(/\//g,'-')}">`;
            html += `<div class="day-header">${dayName} <span style="font-weight:normal; opacity:0.7">(${date})</span></div>`;

            items.forEach(i => {
                const timeStr = `${pad(i.startH)}:00`;
                html += `<div class="atividade-row" style="border:none; padding: 2px 0;">
                <div class="inner-content" style="grid-template-columns: 60px 1fr;">
                <span class="hora" style="font-size:0.8rem">${timeStr}</span>
                <span class="desc" style="font-size:0.85rem">${i.atividade}</span>
                </div>
                </div>`;
            });
            html += `</div>`;
        });

        this.container.innerHTML = html;

        setTimeout(() => {
            let targetId = `date-${this.targetDateStr.replace(/\//g,'-')}`;
            let el = document.getElementById(targetId);
            if(!el) {
                targetId = `date-${todayStr.replace(/\//g,'-')}`;
                el = document.getElementById(targetId);
            }
            if(el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    updateActiveRow() {
        const todayStr = this.getCurrentDateStr();
        if(this.viewMode === 'single' && this.targetDateStr !== todayStr) return;

        const h = new Date().getHours();
        const rows = this.container.querySelectorAll('.atividade-row');

        rows.forEach(row => {
            const rowDate = row.getAttribute('data-date');
            if(rowDate && rowDate !== todayStr) return;

            const start = parseInt(row.getAttribute('data-start'));
            const end = parseInt(row.getAttribute('data-end'));
            const content = row.querySelector('.inner-content');

            if (h >= start && h < end) {
                content.classList.add('current');
            } else {
                content.classList.remove('current');
            }
        });
    }

    // ... Helpers inalterados ...
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
        if(this.currentIndex === -1) return { current: { atividade: "Free", tag: "others" }, nextHour: null };
        const curr = this.allData[this.currentIndex];
        const next = this.allData[this.currentIndex + 1];
        return {
            current: { atividade: curr[5], tag: curr[6] ? curr[6].toLowerCase().trim() : 'others' },
            nextHour: next ? { atividade: next[5], tag: next[6] ? next[6].toLowerCase().trim() : 'others' } : null
        };
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

        // --- LÓGICA DO MODO AUTOMÁTICO (SCHEDULE) ---
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
                // Se o timer manual estiver DESLIGADO, usa o automático
                if(!this.manual.on) this.autoLogic(s.current, s.nextHour);
            } else {
                if(!this.manual.on) {
                    if(this.elBtn) this.elBtn.classList.add('hidden');
                    if(this.elReset) this.elReset.classList.add('hidden');
                    this.freeTimeLogic(currentActivity);
                }
            }
        }

        // --- LÓGICA DO MODO MANUAL (POMODORO) ---
        if(this.manual.on) {
            const now = Date.now();
            const secondsLeft = Math.ceil((this.manual.endTime - now) / 1000);

            this.manual.left = secondsLeft;

            // QUANDO O TEMPO ACABA:
            if(this.manual.left <= 0) {
                playNotificationSound();

                // 1. Troca o Modo (Focus <-> Break)
                this.manual.mode = this.manual.mode === 'focus' ? 'break' : 'focus';

                // 2. Lê os inputs para pegar o tempo do novo modo
                this.readInputs();

                // 3. REINICIA AUTOMATICAMENTE
                this.manual.left = this.manual.total;
                this.manual.endTime = Date.now() + (this.manual.total * 1000); // Define o novo alvo

                // Nota: Não colocamos 'this.manual.on = false', então ele continua rodando.

                // 4. Atualiza textos e cores
                this.updateButtonsText();
            }

            // Atualiza a barra e o texto na tela (Espelho visual)
            const col = this.getManualColor();
            const lbl = this.getManualLabel();
            this.updateUI(this.manual.left, this.manual.total, col, lbl);
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

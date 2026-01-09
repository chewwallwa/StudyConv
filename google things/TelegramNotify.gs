/**
 * LÊ O BACKUP (JSON), PEGA O TOKEN E ENVIA NOTIFICAÇÃO SE TIVER ATIVIDADE AGORA.
 */
function checkAndNotifyTelegram() {
    const FILENAME = "studyconv_sync.json";

    // 1. Tenta ler o arquivo de backup para pegar Token e ID
    const files = DriveApp.getFilesByName(FILENAME);
    if (!files.hasNext()) {
        console.log("⚠️ Arquivo de backup não encontrado. Faça um 'Force Upload' pelo site primeiro.");
        return;
    }

    const file = files.next();
    const content = file.getBlob().getDataAsString();
    let backupData;

    try {
        backupData = JSON.parse(content);
    } catch (e) {
        console.error("Erro ao ler JSON de backup.");
        return;
    }

    // Lógica para extrair Token/ID do formato "Mirror" (Espelho)
    let botToken = "";
    let chatId = "";

    if (backupData.mirror) {
        botToken = backupData.mirror.cfgTgToken;
        chatId = backupData.mirror.cfgTgId;
    }
    // Fallback para versões antigas
    else if (backupData.telegram) {
        botToken = backupData.telegram.token;
        chatId = backupData.telegram.id;
    }

    if (!botToken || !chatId) {
        console.log("⚠️ Token ou ID do Telegram não encontrados no backup. Configure no site e salve.");
        return;
    }

    // 2. Acessa a Agenda (Aba linear_data)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("linear_data");

    if (!sheet) {
        console.error("Aba 'linear_data' não encontrada. Rode o gerador de agenda primeiro.");
        return;
    }

    // 3. Verifica Data e Hora
    const now = new Date();
    const currentHour = now.getHours();
    // Ajuste o fuso horário conforme sua planilha (ex: "GMT-3")
    const todayStr = Utilities.formatDate(now, ss.getSpreadsheetTimeZone(), "dd/MM/yyyy");

    console.log(`Verificando agenda para ${todayStr} às ${currentHour}h...`);

    const data = sheet.getDataRange().getValues();

    // Começa do 1 para pular cabeçalho
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Coluna C (índice 2) = Data, Coluna E (índice 4) = Hora
        const rowDateObj = row[2];
        const rowTimeRaw = row[4];

        if (!rowDateObj || rowTimeRaw === "") continue;

        const rowDateStr = Utilities.formatDate(new Date(rowDateObj), ss.getSpreadsheetTimeZone(), "dd/MM/yyyy");

        // Bateu a data?
        if (rowDateStr === todayStr) {

            // Tratamento da Hora (pode ser número ou texto "08:00")
            let rowH = -1;
            if (typeof rowTimeRaw === 'number') {
                rowH = rowTimeRaw;
            } else {
                rowH = parseInt(String(rowTimeRaw).split(':')[0], 10);
            }

            // Bateu a hora?
            if (rowH === currentHour) {
                const activity = row[5]; // Coluna F = Atividade
                const block = row[1];    // Coluna B = Bloco

                const message = `🔔 *Atividade:* **${activity}**`;

                sendTelegramMessage(botToken, chatId, message);

                // Break opcional: se tiver duas tarefas na mesma hora, remove o break pra mandar as duas
                // break;
            }
        }
    }
}

// Função auxiliar de envio
function sendTelegramMessage(token, chatId, text) {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
        'chat_id': chatId,
        'text': text,
        'parse_mode': 'Markdown'
    };

    try {
        UrlFetchApp.fetch(url, {
            'method': 'post',
            'contentType': 'application/json',
            'payload': JSON.stringify(payload)
        });
        console.log("✅ Mensagem enviada: " + text);
    } catch (e) {
        console.error("Erro no envio Telegram: " + e);
    }
}

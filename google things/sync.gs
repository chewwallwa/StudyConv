// --- CONFIGURAÇÃO ---
const SECRET_KEY = ""; // Mude isso! Funciona como sua senha.
const FILENAME = "studyconv_sync.json"; // Nome do arquivo no Drive
// --------------------

/**
 * SALVAR (Site -> Drive)
 */
function doPost(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const data = JSON.parse(e.postData.contents);

        // 1. Verifica a Senha
        if (data.key !== SECRET_KEY) {
            return response({ "status": "error", "message": "Senha incorreta!" });
        }

        // 2. Busca ou Cria o arquivo no Drive
        const files = DriveApp.getFilesByName(FILENAME);
        let file;
        if (files.hasNext()) {
            file = files.next();
        } else {
            file = DriveApp.createFile(FILENAME, "{}");
        }

        // 3. Salva o conteúdo (Payload)
        file.setContent(JSON.stringify(data.payload));

        return response({ "status": "success", "message": "Backup salvo no Drive!" });

    } catch (err) {
        return response({ "status": "error", "message": err.toString() });
    } finally {
        lock.releaseLock();
    }
}

/**
 * CARREGAR (Drive -> Site)
 */
function doGet(e) {
    try {
        // 1. Verifica a Senha (passada na URL ?key=...)
        if (e.parameter.key !== SECRET_KEY) {
            return response({ "status": "error", "message": "Senha incorreta!" });
        }

        // 2. Busca o arquivo
        const files = DriveApp.getFilesByName(FILENAME);
        if (!files.hasNext()) {
            return response({ "status": "empty", "payload": null }); // Arquivo ainda não existe
        }

        // 3. Lê e retorna o conteúdo
        const file = files.next();
        const content = file.getBlob().getDataAsString();

        return response({ "status": "success", "payload": JSON.parse(content) });

    } catch (err) {
        return response({ "status": "error", "message": err.toString() });
    }
}

// Função auxiliar para formatar resposta JSON
function response(data) {
    return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function testarPermissoes() {
    DriveApp.getFilesByName("teste");
    console.log("Permissão concedida!");
}

function forcarPermissaoDeEscrita() {
    // Isso vai criar um arquivo inútil só para o Google pedir a permissão
    DriveApp.createFile("arquivo_teste_temp.txt", "Se leu isso, funcionou!");
    console.log("Permissão de ESCRITA concedida!");
}

## How to load the cronogram

Faça sua planilha no meu modelo, rode o script (instruções abaixo), para transformar a planilha visual em linear data pro site. Publique o link e cole no script.js.

tag "estudo": 50 min focus, 5 min racuperacao ativa, 5 min rest
intervalo entre atividades "estudo" com nome diferente: 40 min focus, 5 min racuperacao ativa, 15 min rest
outras: mostra timer pra proxima atividade "estudo" e pomodoro manual

faça o mesmo pra aba "material" da planilha (links diferentes pra cada aba)

## How to turn a cronogram in raw data for the site

<details><summary>see</summary>

## 📅 Gerador de Cronograma Escolar/Acadêmico (Google Sheets)

Este script automatiza a criação de uma agenda linear (database) a partir de um cronograma visual semanal no Google Sheets. Ideal para estudantes e concurseiros que planejam estudos por blocos e precisam contabilizar horas líquidas.

### 🚀 O que ele faz
Transforma uma tabela visual (Blocos de Horários) em uma lista de dados contendo:
- Nome do Curso/Matéria
- Data exata (dd/mm/aaaa)
- Dia da Semana
- Hora
- Atividade

Ele resolve automaticamente conflitos de datas, corrige fusos horários e processa múltiplos blocos de uma vez.

## ⚠️ Avisos Importantes (Leia antes de usar)

### 1. Verifique o Código
Como boa prática de segurança, **nunca execute scripts desconhecidos** na sua conta Google sem antes ler o código. O código é aberto (`.gs` ou `.js`) e você pode conferir que ele apenas lê os dados da aba `main` e escreve na aba `DB_Final`. Ele não acessa seu e-mail, drive ou contatos.

### 2. Permissão de Execução (Google)
Na primeira vez que rodar, o Google mostrará um aviso de "Aplicativo não verificado" (porque este script não foi publicado na loja oficial). Para autorizar:
1. Clique em **Revisar Permissões**.
2. Selecione sua conta.
3. Na tela de "O Google não verificou este app", clique em **Avançado**.
4. Clique no link no rodapé: **Acessar [Nome do Projeto] (não seguro)**.
5. Clique em **Permitir**.
*Isso é padrão para qualquer script pessoal no Google Sheets.*

---

## 🛠️ Como Usar

1. Abra sua planilha no Google Sheets.
2. Vá em **Extensões** > **Apps Script**.
3. Apague qualquer código existente e cole o conteúdo do arquivo `script.js` deste repositório.
4. Salve o projeto.
5. Volte para a planilha e atualize a página (F5).
6. Um novo menu **"📅 Cronograma"** aparecerá no topo. Clique em **Atualizar Agenda**.

## 📋 Requisitos da Planilha

A aba principal deve se chamar `main` e seguir o layout:
* **Colunas A-H:** Grade de horários (A=Hora, B=Dom... H=Sab).
* **Colunas I-L:** Metadados dos blocos (Curso, Bloco, Data Início, Data Fim).

</details>

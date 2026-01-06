# StudyConv

A comfy and clean dashboard designed to synchronize your life with your study schedule.
Maybe it is not the easiest or fastest thing to use ar fisrt, but it is the last time you will will be lost in your life.

## ✨ Features

### 📅 Dynamic Schedule: Automatically syncs with a Google Sheet to show your current activity, block, and subject based on the time of day.

### 🍅 Smart Pomodoro:

  - Auto Mode: Automatically detects "Study" blocks and enables the timer logic based on your schedule.
  - Manual Mode: Standard Pomodoro timer for ad-hoc sessions.

### ✅ Timer Queue: A built-in timer queue to manage a list os timers with sequential individual countdowns, colors and name.

### 📝 Integrated Notes:

  - Pomodoro Notes: A hidden text area attached to the timer card.
  - Notes on sidebars
  - All notes are auto-saved to your browser's Local Storage.

### 📚 Study Topics: Fetches your syllabus/topics from the spreadsheet, allowing you to mark them as done. Includes a "Pin Mode" to keep focus on the list.

### 🎨 Settings:

  - Dark/Light Mode toggle.
  - Settings panel to easily swap out Spreadsheet data sources.

### Mobile and little screens support

## Preview

### Github pages on the repo has the example sheet working

### features preview

https://github.com/user-attachments/assets/cbab623c-7c01-482c-b71f-f0839149f219

### resizing/mobile preview

https://github.com/user-attachments/assets/d4bbe2e9-ea5f-4c7e-a490-ce87e11c4f04

## 🚀 How to Use
1. Acess the github pages link and put your google sheet links :)

2. Spreadsheet Setup

This dashboard relies on Google Sheets to feed data (Schedule, Topics, Methodology).

  - Create your Google Sheet from my template (there are some notes on how to use).

[**Link for the template**](https://docs.google.com/spreadsheets/d/13o1PEcNd045ZOiusKWNUUGKH8LrgA80qO-Hi97hk22s/edit?usp=sharing ) (For privacy you can manually copy the template and the script to self-host run it(google: "lol") )

  - Important: Go to File > Share > Publish to web.
  - Select the specific tab (e.g., "Schedule") and choose Comma-separated values (.csv) as the format.
  - Copy the generated link. 

3. Configuration

    - Open the Dashboard.
    - Click the Settings (⚙️) icon in the right sidebar.
    - Paste your CSV links into the corresponding fields.
    - Click Save & Reload.

## 🔮 Future

  - Standalone Lite Version: I am currently working on a web-based version that removes the schedule dependency. It will focus solely on the Pomodoro timer, Task Queue, and Notes system for users who don't need the Google Sheets integration. Gonna take some time :)
  - Smartwatch and touch support
  - Online Storage for syncing between devices ? (I don't want to have a login section or like this. I really want this to be private)
  - Turn into app ? (on the next life)

### 🛠️ Tech Stack

  - Frontend: HTML5, CSS3 (Variables & Flexbox), Vanilla JavaScript (ES6+).
  - Data Source: Google Sheets (CSV).
  - Storage: LocalStorage (for notes, settings, and theme preference).
  - **Note**: Don't judge me, at least it is good :) Most of the JS was created with AI :)

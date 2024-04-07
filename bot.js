require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const admins = process.env.ADMIN_TELEGRAM_IDS.split(',').map((id) => parseInt(id, 10));
const groupInfo = {
  id: process.env.GROUP_ID,
  rules: 'Hier sind die Gruppenregeln...',
  welcomeMessage: 'Willkommen in unserer Gruppe!',
};

// Ersetze die Gruppen-ID durch deine Gruppen-ID
const GROUP_ID = process.env.GROUP_ID;

// Ersetze dies mit der Chat-ID des Admins
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

bot.onText(/\/start/, (msg) => {
    try {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 'Bot Start');
    } catch (error) {
      console.error('Fehler beim Verarbeiten des /start-Befehls:', error);
    }
  });
  
  bot.onText(/\/help/, (msg) => {
    try {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 'Du benötigst Hilfe?, führe den Befehl /admincmd aus um eine liste aller Commands für Administratoren anzeigen zu lassen oder /usercmd um eine liste aller Benutzer Commanda anzeigeb zu lassen für weitere Hilfe führe den Befehl /botinfo aus um dir Kontakt möglichkeiten zum support anzeigen zu lassen.');
    } catch (error) {
      console.error('Fehler beim Verarbeiten des /help-Befehls:', error);
    }
  });

  // Handle '/info' Befehl
bot.onText(/\/ginfo/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Gruppenname: ${msg.chat.title}\nGruppen-ID: ${chatId}`);
  });

function isAdmin(userId) {
    return admins.includes(userId);
  }

  const upcomingFeatures = [
    'Funktion zum Teilen von Dateien',
    'Benachrichtigungen für Gruppenereignisse',
    'Verbesserungen an der Willkommensnachricht',
    'Weitere Admin commands wie z.b. "/ban" oder "/mute"',
    'Bad Username Filter',
    'Bad Word Filter (erledigt)',
    'Domain White & Blacklist (erledigt)'
    // Füge weitere Funktionen hinzu
  ];

// Handle '/clog' Befehl
bot.onText(/\/clog/, (msg) => {
    const chatId = msg.chat.id;
  
    // Erstelle eine formatierte Liste der kommenden Funktionen
    const formattedFeatures = upcomingFeatures.map((feature, index) => `${index + 1}. ${feature}`).join('\n');
  
    // Sende die Liste als Nachricht
    bot.sendMessage(chatId, `**Kommende Funktionen:**\n\n${formattedFeatures}`, { parse_mode: 'Markdown' });
  });

  const botCreator = {
    name: 'Rusher2510',
    username: '@Florianh7795',
    supportChannel: 't.me/support_channel',
  };

// Handle '/botinfo' Befehl
bot.onText(/\/botinfo/, (msg) => {
    const chatId = msg.chat.id;
  
    // Sende die Informationen als Nachricht
    bot.sendMessage(
      chatId,
      `**Bot-Informationen:**
      - Aktuelle Version: 1.2
      - Ersteller: [${botCreator.name}](https://t.me/${botCreator.username})
      - Copyright: © ${new Date().getFullYear()} Dein Bot-Ersteller
      - Support-Kanal: [Support-Kanal](https://t.me/${botCreator.supportChannel})`,
      { parse_mode: 'Markdown' }
    );
  });

// Handle '/admincmd' Befehl (Admins only)
bot.onText(/\/admincmd/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    // Überprüfe, ob der Absender ein Administrator ist
    if (!isAdmin(msg.from.id)) {
      bot.sendMessage(userId, 'Nur Administratoren dürfen diesen Befehl ausführen.');
      return;
    }
  
    // Erstelle eine formatierte Liste der Admin-Befehle mit leeren Zeilen
    const formattedAdminCommands = adminCommandsList
      .map((cmd) => `<b>${cmd.command}</b>: ${cmd.description}`)
      .join('\n\n');
  
    // Sende die Liste als Nachricht mit HTML-Formatierung
    bot.sendMessage(userId, `Liste der Admin-Befehle:\n\n${formattedAdminCommands}`, { parse_mode: 'HTML' });
  });

  // Liste der Admin-Befehle
const adminCommandsList = [
    { command: '/admincmd', description: 'Zeigt eine liste aller Admin-Befehle' },
    { command: '/usercmd', description: 'Zeigt aktuelle informationen der Gruppe an' },
    { command: '/warn @username \'Grund\'', description: 'Verwarnt einen markierten Benutzer (bei 3 Verwarnungen automatisch gebannt)' },
    
  ];

  let badWords = [];

  // Lese die schlimmen Wörter aus der Datei
  try {
    const badWordsFile = fs.readFileSync('bad_words.txt', 'utf-8');
    badWords = badWordsFile.split('\n').map((word) => word.trim().toLowerCase());
  } catch (error) {
    console.error('Fehler beim Lesen der Datei "bad_words.txt":', error);
  }
  
  bot.onText(/(.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = match[1].toLowerCase(); // Vergleiche unabhängig von Groß- und Kleinschreibung
  
    // Überprüfe, ob die Nachricht schlimme Wörter enthält
    if (containsBadWord(text)) {
      // Lösche die Nachricht
      bot.deleteMessage(chatId, msg.message_id);
  
      // Sende eine Warnung an den Benutzer
      bot.sendMessage(userId, 'Deine Nachricht enthält unangemessene Wörter. Bitte achte auf deine Wortwahl.');
    }
  });
  
  // Funktion, um zu überprüfen, ob eine Nachricht schlimme Wörter enthält
  function containsBadWord(text) {
    return badWords.some((word) => text.includes(word));
  }
  
  let whitelistedUrls = [];
  
  // Lese die whitelisted URLs aus der Datei
  try {
    const whitelistFile = fs.readFileSync('whitelisted_urls.txt', 'utf-8');
    whitelistedUrls = whitelistFile.split('\n').map((url) => url.trim().toLowerCase());
  } catch (error) {
    console.error('Fehler beim Lesen der Datei "whitelisted_urls.txt":', error);
  }
  
  bot.onText(/\/listurl (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const adminId = msg.from.id;
    const newUrl = match[1].trim().toLowerCase();
  
    // Überprüfe, ob der Befehl von einem Admin kommt
    if (!isAdmin(adminId)) {
      bot.sendMessage(chatId, 'Nur Admins dürfen diesen Befehl ausführen.');
      return;
    }
  
    // Füge die URL zur Whitelist hinzu
    whitelistedUrls.push(newUrl);
  
    // Speichere die aktualisierten URLs in der Datei
    saveWhitelistedUrls();
  
    bot.sendMessage(chatId, `Die URL "${newUrl}" wurde zur Whitelist hinzugefügt.`);
  });
  
  bot.onText(/(.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = match[1].toLowerCase();
  
    // Überprüfe, ob die Nachricht eine URL enthält und ob sie in der Whitelist ist
    if (containsUrl(text) && !isWhitelistedUrl(text)) {
      // Lösche die Nachricht
      bot.deleteMessage(chatId, msg.message_id);
  
      // Sende eine Warnung an den Benutzer
      bot.sendMessage(userId, 'Nur whitelisted URLs sind in dieser Gruppe erlaubt. Bitte keine unerwünschten URLs teilen.');
    }
  });
  
  // Funktion, um zu überprüfen, ob eine Nachricht eine URL enthält
  function containsUrl(text) {
    // Regulärer Ausdruck, um URLs zu erkennen (einfach gehalten)
    const urlRegex = /(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    return urlRegex.test(text);
  }
  
  // Funktion, um zu überprüfen, ob eine URL in der Whitelist ist
  function isWhitelistedUrl(url) {
    return whitelistedUrls.includes(url);
  }
  
  // Funktion zum Speichern der Whitelist in einer Datei
  function saveWhitelistedUrls() {
    const whitelistFilePath = 'whitelisted_urls.txt';
  
    // Erstelle die Datei 'whitelisted_urls.txt', falls sie nicht existiert
    if (!fs.existsSync(whitelistFilePath)) {
      fs.writeFileSync(whitelistFilePath, '');
    }
  
    // Schreibe die aktualisierten URLs in die Datei
    fs.writeFileSync(whitelistFilePath, whitelistedUrls.join('\n'), 'utf-8');
  }
  
  const whitelistedUrlsFilePath = 'whitelisted_urls.txt';
  
  // Angepasster Befehl zum Abrufen der zugelassenen Domains
  bot.onText(/\/aurl/, (msg) => {
    const chatId = msg.chat.id;
  
    // Lese die zugelassenen Domains aus der Datei
    let whitelistedUrls = [];
    try {
      const whitelistedUrlsFile = fs.readFileSync(whitelistedUrlsFilePath, 'utf-8');
      whitelistedUrls = whitelistedUrlsFile.split('\n').map((url) => url.trim());
    } catch (error) {
      console.error('Fehler beim Lesen der Datei "whitelisted_urls.txt":', error);
    }
  
    // Sende die Liste der zugelassenen Domains als private Nachricht an den Benutzer
    if (whitelistedUrls.length > 0) {
      const formattedUrls = whitelistedUrls.map((url) => `- ${url}`).join('\n');
      bot.sendMessage(msg.from.id, `Liste der zugelassenen Domains:\n\n${formattedUrls}`)
        .then(() => {
          // Lösche den Befehl nach dem Senden der privaten Nachricht
          bot.deleteMessage(chatId, msg.message_id);
        })
        .catch((error) => {
          console.error('Fehler beim Löschen des Befehls:', error);
        });
    } else {
      bot.sendMessage(chatId, 'Die Liste der zugelassenen Domains ist leer.');
    }
  });
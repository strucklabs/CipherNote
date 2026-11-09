# 🛡️ CipherNote – Sichere Notiz- & Clipboard-Zentrale

[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-success.svg)](https://web.dev/progressive-web-apps/)
[![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-teal.svg)](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)

**CipherNote** ist eine moderne, Ende-zu-Ende verschlüsselte Progressive Web App (PWA) zur privaten Erfassung von Notizen, Zwischenablage-Inhalten, Fotos und Sprachaufnahmen. Alle Daten werden ausschließlich im Browser mit **AES-256-GCM** verschlüsselt – der Master-Schlüssel verlässt niemals den Arbeitsspeicher Ihres Endgeräts (*Zero-Knowledge-Architektur*).

---

## ✨ Features im Überblick

### 🔒 Kompromisslose Sicherheit & Zero-Knowledge
* **AES-256-GCM Verschlüsselung:** Notiztexte, Titel, Tags, Anhänge, Bilder und Audiodateien werden mit militärischer Verschlüsselung und 128-Bit-Integritätsprüfung (Auth-Tag) gesichert.
* **PBKDF2-Schlüsselableitung:** Ihr Master-Passwort wird über 250.000 SHA-256-Runden mit einem kryptographisch zufälligen Salt geschützt.
* **Master-Passwort Verwaltung:** Vergabe und nachträgliche Änderung des Master-Passworts inklusive automatischer Neuverschlüsselung aller bestehenden Notizen im Hintergrund.
* **Schutz vor Datenverlust:** Ein Zurücksetzen auf den Standard-Tresor verlangt zur Absicherung die explizite Bestätigungseingabe des Wortes `LÖSCHEN`. Der 1-Klick-Schnellstart öffnet nur Tresore ohne benutzerdefiniertes Passwort.
* **Flüchtiger Arbeitsspeicher:** Der entschlüsselte Schlüssel wird niemals persistent in Cookies oder Storage geschrieben. Nach dem Sperren wird der Schlüssel sofort aus dem RAM getilgt.

### 📱 Progressive Web App (PWA) & Mobile-First
* **Installierbar:** Direkte Installation als eigenständige App auf Android (Google Pixel, Samsung Galaxy etc.), iOS (Safari: Zum Home-Bildschirm) und Desktop (Chrome/Edge).
* **Robuster Offline-Betrieb:** Automatisches Pre-Caching der Kernressourcen und Startseite im Service Worker (`sw.js`).
* **Android Web Share Target:** Inhalte (Texte, Links, Zwischenablage) direkt aus jeder nativen Android-App heraus mit CipherNote teilen.
* **Schneller Schnellzugriff:** Dezenter PWA-Installations-Button sowohl in der oberen Menüleiste als auch auf dem Sperrbildschirm.

### 📸 Live-Kamera & Bildverarbeitung
* **Integrierter Live-Kamera-Sucher (`CameraModal`):** Direkte Fotoaufnahme im Browser über WebRTC – funktioniert auf Desktop-Webcams und Smartphones gleichermaßen.
* **Kamerawechsel:** Nahtloser Wechsel zwischen Haupt- (Rückseite) und Frontkamera.
* **Smart Compression:** Hohe Auflösungen moderner Smartphone-Kameras (z. B. Pixel 50 MP) werden automatisch verlustarm optimiert (~80–150 KB), ohne die Lesbarkeit von Dokumenten zu beeinträchtigen.
* **System-Fallback:** Wahlweise kann auch die native Kamera-App des Smartphones oder die Dateiauswahl genutzt werden.

### 🎙️ Audio- & Sprachmemos
* **Dedizierter Aufnahme-Dialog (`VoiceMemoModal`):** Stabiles Aufnahme-Interface mit Live-Timer, Wellenform-Animation und Play/Pause-Voransicht vor dem Speichern.
* **Cross-Browser-Unterstützung:** Automatische MIME-Typ-Erkennung (Opus, WebM, MP4, AAC) für Android Chrome, Desktop und iOS Safari.
* **System-Diktiergerät-Anbindung:** Fallback-Schaltfläche zum Öffnen des nativen Smartphone-Diktiergeräts.

### 📋 Schnellerfassung & Clipboard-Integration
* **1-Klick-Übernahme:** Automatische Erfassung von Texten und Screenshots direkt aus der Zwischenablage.
* **Globaler Paste-Handler:** Einfach überall im Browser `Strg+V` drücken, um Inhalte als Notiz zu sichern.

### ⏰ Fristen, Deadlines & Organisation
* **Erinnerungs-Banner:** Farbcodierte Warnleiste (Gelb für anstehende Fristen, Rot für überfällige Aufgaben).
* **Schnellauswahl:** 1-Klick-Vorgaben für *„Heute 20:00“*, *„Morgen 09:00“*, *„In 3 Tagen“* oder *„Nächste Woche“*.
* **Organisation:** Anpinnen (`Pin`), Hashtags (`#Tag`), Volltextsuche (`/` Schnelltaste) und Schnellfilter (Alle, Gepinnt, Fristen, Clips).

### ☁️ Backup & Cloud-Synchronisation
* **Verschlüsselter Datei-Export (`.ciph`):** Vollständige AES-256-gesicherte Backups zum lokalen Speichern.
* **Eigene Cloud via WebDAV:** Direkte Synchronisation mit Nextcloud, ownCloud oder jedem WebDAV-kompatiblen Cloud-Speicher.

---

## 🛠️ Tech Stack

* **Framework:** [React 19](https://react.dev/) mit TypeScript
* **Build-Tool:** [Vite 8](https://vitejs.dev/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Kryptographie:** Native Browser [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) (`crypto.subtle`)
* **Icons:** [Lucide React](https://lucide.dev/)
* **PWA:** Web App Manifest & Service Worker

---

## 🌐 Deployment auf eigenem Webspace (Apache / Nginx)

CipherNote ist eine rein statische Single-Page-App (SPA). Sie benötigt **kein Node.js, kein PHP und keine Server-Datenbank**.

### 1. Build erzeugen
```bash
npm run build
```
Der erstellte Ordner `dist/` enthält alle fertigen HTML-, JS-, CSS- und PWA-Dateien.

### 2. Auf den Webspace hochladen
Laden Sie den gesamten Inhalt aus `dist/` in das Web-Verzeichnis (z. B. `public_html` oder `htdocs`) Ihres Webservers hoch.

### 3. `.htaccess` für Apache-Webserver (HTTPS + SPA-Routing)
Erstellen Sie im selben Web-Verzeichnis eine `.htaccess`-Datei mit folgendem Inhalt:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Automatisch immer von unverschlüsseltem HTTP auf sicheres HTTPS umleiten
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # 2. SPA-Routing: Reale Dateien ausliefern, alle anderen URLs auf index.html leiten
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# 3. PWA-Updates sofort aktivieren (sw.js nicht cachen)
<Files "sw.js">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
  Header set Pragma "no-cache"
  Header set Expires 0
</Files>
```

---

## 🚀 Schnellstart (Lokale Entwicklung)

### Voraussetzungen
* [Node.js](https://nodejs.org/) (Version 18 oder höher empfohlen)
* [npm](https://www.npmjs.com/) oder [bun](https://bun.sh/)

### 1. Repository klonen
```bash
git clone https://github.com/IhrBenutzername/ciphernote.git
cd ciphernote
```

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Entwicklungsserver starten
```bash
npm run dev
```
Die Anwendung ist nun unter **`http://localhost:3000`** im Browser erreichbar (mit Hot-Module-Reloading).

### 4. Produktions-Build erstellen
```bash
npm run build
```

---

## 🔐 Kryptographische Architektur

| Komponente | Verwendeter Algorithmus / Standard |
| :--- | :--- |
| **Symmetrische Verschlüsselung** | **AES-256-GCM** (Authentifizierte Verschlüsselung mit 128-Bit Auth-Tag) |
| **Initialisierungsvektor (IV)** | 12 Bytes kryptographisch zufällig pro Verschlüsselungsvorgang |
| **Schlüsselableitung (KDF)** | **PBKDF2** mit HMAC-SHA-256, 250.000 Iterationen |
| **Salt** | 16 Bytes kryptographisch zufällig (`crypto.getRandomValues`) |
| **Schlüsselspeicherung** | Ausschließlich im flüchtigen RAM (`CryptoKey`-Objekt) |

---

## 📂 Projektstruktur

```text
├── public/                 # PWA-Manifest, Icons, Service Worker (sw.js)
├── src/
│   ├── components/         # UI-Komponenten
│   │   ├── CameraModal.tsx         # Live-Kamera-Sucher & Schnappschuss
│   │   ├── VoiceMemoModal.tsx      # Mikrofon-Aufnahme & Audio-Vorschau
│   │   ├── ClipboardDropzone.tsx   # Schnellauswahl (Kamera, Audio, Einfügen)
│   │   ├── NoteEditor.tsx          # Notiz-Detailansicht, Markdown & Toolbar
│   │   ├── NotesSidebar.tsx        # Notizliste, Suche, Sortierung
│   │   ├── TopBar.tsx              # PWA-Install-Button, Vault-Lock, Theme
│   │   ├── VaultLockModal.tsx      # Tresor-Entsperrung & Werksreset-Schutz
│   │   ├── VaultSecurityModal.tsx  # Master-Passwort ändern & Re-Verschlüsselung
│   │   ├── CloudSyncModal.tsx      # WebDAV / Nextcloud & Backup-Export (.ciph)
│   │   └── ...
│   ├── lib/
│   │   ├── crypto.ts       # AES-256-GCM & PBKDF2 Web Crypto Implementierung
│   │   ├── storage.ts      # Lokale verschlüsselte Persistenz & Backup
│   │   ├── media.ts        # createImageBitmap-Komprimierung & Audio-Helper
│   │   └── platform.ts     # Plattformerkennung & Web Share API
│   ├── App.tsx             # Hauptanwendungs-Layout & Vault-Zustand
│   └── main.tsx            # React Entry Point
├── package.json
├── vite.config.ts
└── README.md
```

---

## 📄 Lizenz

Dieses Projekt ist unter der [MIT-Lizenz](LICENSE) lizenziert.

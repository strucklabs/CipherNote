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
* **AES-256-GCM Verschlüsselung:** Notiztexte, Titel, Tags, Bilder und Audiodateien werden mit militärischer Verschlüsselung und Integritätsprüfung (Auth-Tag) gesichert.
* **PBKDF2-Schlüsselableitung:** Ihr Master-Passwort wird über 250.000 SHA-256-Runden mit einem kryptographisch zufälligen Salt geschützt.
* **Flüchtiger Arbeitsspeicher:** Der entschlüsselte Schlüssel wird niemals persistent in Cookies oder Storage geschrieben. Nach dem Sperren wird der Schlüssel sofort aus dem RAM gelöscht.
* **Auto-Vault-Setup:** Sofort einsatzbereit beim ersten Start, mit der Option, jederzeit ein persönliches Master-Passwort zu vergeben.

### 📸 Live-Kamera & Bildverarbeitung
* **Integrierter Live-Kamera-Sucher (`CameraModal`):** Direkte Fotoaufnahme im Browser über WebRTC – funktioniert auf Desktop-Webcams und Smartphones gleichermaßen.
* **Kamerawechsel:** Nahtloser Wechsel zwischen Haupt- (Rückseite) und Frontkamera.
* **Smart Compression:** Hohe Auflösungen (z. B. 50 MP von modernen Handys) werden automatisch verlustarm auf WebP/JPEG optimiert (~80–150 KB), ohne die Lesbarkeit zu beeinträchtigen.
* **System-Fallback:** Wahlweise kann auch die native Kamera-App des Smartphones oder die Dateiauswahl genutzt werden.

### 🎙️ Audio- & Sprachmemos
* **Dedizierter Aufnahme-Dialog (`VoiceMemoModal`):** Stabiles Aufnahme-Interface mit Live-Timer, Wellenform-Animation und Play/Pause-Voransicht vor dem Speichern.
* **Cross-Browser-Unterstützung:** Automatische MIME-Typ-Erkennung (Opus, WebM, MP4, AAC) für Android Chrome, Desktop und iOS Safari.
* **System-Diktiergerät-Anbindung:** Fallback-Schaltfläche zum Öffnen des nativen Smartphone-Diktiergeräts.

### 📋 Schnellerfassung & Clipboard-Integration
* **1-Klick-Übernahme:** Automatische Erfassung von Texten und Screenshots direkt aus der Zwischenablage.
* **Globaler Paste-Handler:** Einfach überall im Browser `Strg+V` drücken, um Inhalte als Notiz zu sichern.
* **Android Web Share Target:** Teilen Sie Links und Texte aus jeder anderen Android-App direkt in CipherNote.

### ⏰ Fristen, Deadlines & Organisation
* **Erinnerungs-Banner:** Farbcodierte Warnleiste (Gelb für anstehende Fristen, Rot für überfällige Aufgaben).
* **Schnellauswahl:** 1-Klick-Vorgaben für *„Heute 20:00“*, *„Morgen 09:00“*, *„In 3 Tagen“* oder *„Nächste Woche“*.
* **Organisation:** Anpinnen (`Pin`), Hashtags (`#Tag`), Volltextsuche (`/` Schnelltaste) und Schnellfilter (Alle, Gepinnt, Fristen, Clips).

### 📱 Progressive Web App (PWA)
* **Installierbar:** Direkte Installation als App auf Android (Pixel, Samsung etc.), iOS (Zum Home-Bildschirm) und Desktop (Chrome/Edge).
* **Offline-First:** Vollständig offline nutzbar dank Service Worker und Cache-First-Strategie.
* **Responsiv & Dark Mode:** Perfekt optimiert für Einhandbedienung am Smartphone sowie breite Desktop-Monitore.

---

## 🛠️ Tech Stack

* **Framework:** [React 19](https://react.dev/) mit TypeScript
* **Build-Tool:** [Vite 8](https://vitejs.dev/)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Kryptographie:** Native Browser [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) (`crypto.subtle`)
* **Icons:** [Lucide React](https://lucide.dev/)
* **PWA:** Web App Manifest & Service Worker

---

## 🚀 Schnellstart (Lokale Installation)

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
Generiert die fertigen, minimierten statischen Dateien im Ordner **`dist/`**.

### 5. Produktions-Vorschau testen
```bash
npm run preview
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
│   │   └── ...
│   ├── lib/
│   │   ├── crypto.ts       # AES-256-GCM & PBKDF2 Web Crypto Implementierung
│   │   ├── storage.ts      # Lokale verschlüsselte Persistenz & Backup
│   │   ├── media.ts        # createImageBitmap-Komprimierung & Audio-Helper
│   │   └── platform.ts     # Plattformerkennung & Web Share API
│   ├── App.tsx             # Hauptanwendungs-Layout & Vault-Zustand
│   └── main.tsx            # React Entry Point
├── package.json
└── vite.config.ts
```

---

## 📄 Lizenz

Dieses Projekt ist unter der [MIT-Lizenz](LICENSE) lizenziert.

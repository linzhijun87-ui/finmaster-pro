# FinMaster Pro

**FinMaster Pro** is a privacy-first, offline-capable personal finance management web application built using pure HTML, CSS, and Vanilla JavaScript.

It empowers users to manage income, expenses, budgets, and accounts while maintaining full ownership and control of their data — **without servers, trackers, or analytics**.

---

## Core Principles

- 🔐 **Security First**
- 📴 **Offline-First**
- ☁️ **Optional Cloud Backup**
- 🧑‍💻 **No Backend / No Server**
- 🗝 **User-Owned Credentials**
- 📦 **Public-Safe Open Source**

---

## Features

- 📊 **Income & Expense Tracking**
- 💰 **Account-based fund tracking** (Bank, Cash, E-Wallet)
- 📈 **Category-based Budget Management**
- 🔒 **Client-side encrypted Backup & Restore**
- ☁️ **Google Drive App Data integration** (optional)
- 📴 **Fully functional offline**
- 🌙 **Light & Dark Mode**
- 📱 **Responsive** (Desktop & Mobile)

---

## Security & Privacy Architecture

FinMaster Pro is designed with **zero-trust** and **client-side security** as first-class principles.

### Data Handling

- All financial data is stored **locally in the browser**
- No user data is transmitted unless explicitly requested (Backup)
- No telemetry, tracking, or analytics

### Encryption

Client-side encryption using:
- **AES-GCM** (256-bit)
- **PBKDF2** (SHA-256, 100,000 iterations)

- Encryption keys are derived only from user-provided passwords
- Passwords are **never stored or logged**

> ⚠️ **If an encryption password is lost, encrypted backups are irrecoverable.**

### Backup & Sync (Optional)

FinMaster Pro supports manual encrypted backups to **Google Drive** using the App Data folder.

**Important Characteristics:**
- Backups are encrypted **before leaving the browser**
- Google Drive only stores encrypted blobs
- No backend servers involved
- No automatic background sync

### OAuth Security

Uses **Google Identity Services**

Scope restricted to:
```
https://www.googleapis.com/auth/drive.appdata
```

Access tokens:
- Stored in `sessionStorage` only
- Cleared on tab close
- Never committed to repository

---

## Google OAuth Client ID (User-Provided)

To avoid shipping secrets in public code:

- Users must provide their **own OAuth Client ID**
- No default Client ID exists in this repository
- OAuth Client IDs are public by design (safe for frontend apps)

### Setup Steps

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Drive API**
3. Configure **OAuth Consent Screen**
4. Create **OAuth Client ID** (Web Application)
5. Add **Authorized JavaScript Origins**:
   ```
   http://localhost
   https://<your-username>.github.io
   ```
6. Paste Client ID into:
   ```
   Settings → Backup & Sync
   ```

---

## Deployment

FinMaster Pro is a fully static application.

Supported hosting options:
- GitHub Pages
- Netlify
- Any static hosting provider

**No server configuration required.**

---

## Project Structure

```
finmaster-pro/
├─ index.html
├─ README.md
├─ privacy.html
├─ terms.html
├─ services/
├─ modules/
├─ views/
├─ assets/
```

---

## Legal & Compliance

- 📄 [Privacy Policy](privacy.html)
- 📄 [Terms of Service](terms.html)

This project complies with:
- Client-side OAuth best practices
- Public repository security guidelines
- Minimal permission access principles

---

## License

**MIT License**  
Free to use, modify, and distribute.

---

## Author

**Ferdiansyah Lim**  
Independent Developer

Built with a focus on privacy, security, and long-term maintainability.

---

## Disclaimer

FinMaster Pro is provided **as-is**.  
Users are responsible for managing their own backups and encryption passwords.

# Security Policy

## Overview

FinMaster Pro is a client-side, privacy-first financial application.  
Security is treated as a first-class concern.

This document explains how to report security issues responsibly.

---

## Supported Versions

Only the latest version available on the **main branch** is actively supported.

---

## Reporting a Vulnerability

⚠️ **Please do NOT report security vulnerabilities via public GitHub issues.**

If you discover a security issue, please report it responsibly by:

- Opening a **private communication** with the repository owner
- Or contacting the maintainer directly via email (if provided)

When reporting, please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested mitigation (if any)

---

## Security Design Principles

FinMaster Pro follows these security principles:

- No backend servers
- No hardcoded secrets
- Client-side encryption only
- OAuth scopes restricted to Google Drive App Data
- Session-bound access tokens
- No telemetry or analytics
- User-owned credentials only

---

## Encryption

- AES-GCM (256-bit)
- PBKDF2 (SHA-256, 100,000 iterations)
- Keys derived from user-provided passwords
- Passwords are never stored or logged

---

## Disclaimer

This project is provided "as is".  
Users are responsible for securing their devices, passwords, and backups.

---

Thank you for helping keep FinMaster Pro secure.

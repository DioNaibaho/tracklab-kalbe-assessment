# TRACKLAB — Laboratory Analysis & Tracking System

Aplikasi full-stack **TRACKLAB** untuk manajemen permintaan analisis laboratorium, konfigurasi *master tracker workflow*, progres *tracking* transaksi, serta *real-time audit logging*.

## Arsitektur Sistem

1. **Frontend & BFF Proxy (`frontend/` — Next.js App Router + TypeScript + Tailwind CSS)**
   - **Security & Session Management**: Kredensial API (`app_id`, `app_key`) disimpan aman di sisi server (`.env.local`). Token autentikasi (`access_token` & `refresh_token`) disimpan menggunakan **HttpOnly Cookie**.
   - **Kalbe Pagination & Filtering Standard**: Mengimplementasikan header kustom `X-Paging-Offset`, `X-Paging-Limit`, `X-Paging-SortBy`, `X-Paging-SortOrder`, `X-Paging-Search`, serta `X-Paging-Include` / `X-Paging-Exclude` dengan format encoding Base64.
   - **Modul Fitur**:
     - `/login` — Autentikasi ke API Kalbe Biopharma.
     - `/dashboard` — Ringkasan modul & inspeksi *Authorization Scope*.
     - `/master/tracker` — CRUD Master Workflow Trackers (`m_trackers`).
     - `/request/lab-analysis` — CRUD Transaksi Lab Analysis Request (`t_request_headers`).
     - `/tracking-progress` — CRUD Transaction Trackings (`t_trackings` - Bonus Feature).
     - `/data-history` — Tampilan *real-time* Audit Logs dari backend .NET.

2. **Backend Audit Logging Service (`logger-api/` — ASP.NET Core 8 Web API + EF Core SQLite)**
   - Menyediakan REST API (`POST /api/logs` dan `GET /api/logs`) untuk mencatat seluruh aktivitas pengguna (*Login, Refresh Token, Logout, Create, Update, Delete*) ke database SQLite (`tracklab_logs.db`).

---

## Cara Menjalankan Aplikasi

### 1. Menjalankan Backend Logging (.NET 8)
```bash
cd logger-api
dotnet run --urls "http://localhost:5050"
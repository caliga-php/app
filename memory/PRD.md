# WISECP Admin — PRD

## Problem Statement
Kullanıcı (vexa.net.tr) WISECP v5 hosting/billing panelini, admin panelini açmadan tamamen
telefonundan yönetmek istiyor. React Native + Expo (TypeScript) mobil uygulama, doğrudan
WISECP Admin API'sine bağlanır (ara sunucu yok). Dil: Türkçe. Tema: WISECP mavisi, kurumsal, sade.

## Architecture
- Frontend: Expo Router, React Query (sunucu durumu), React Context (bağlantı/kilit), TypeScript.
- API: fetch tabanlı tip güvenli ApiClient (`src/api/client.ts`) — zarf çözme, rate limiter
  (120/dk, X-RateLimit-*, 429 Retry-After), 401'de retry YOK, Idempotency-Key.
- Güvenlik: API anahtarı Keychain'de (`expo-secure-store` üzerinden storage util), biyometrik
  app lock (`expo-local-authentication`), izne duyarlı UI (wildcard `Group/*`, `*`).
- Çoklu panel profili desteği.
- Backend (FastAPI/Mongo): kullanılmıyor (kullanıcı doğrudan bağlantı seçti).

## Core Requirements (static)
- Panel URL + wak_ anahtarı ile bağlan, ping/whoami doğrula, izinleri sakla.
- Tüm endpoint'ler canlı doğrulandı (docs/endpoint-inventory.md). Endpoint uydurulmadı.

## Implemented (2026-10-05)
- Çekirdek: Connect, oturum kalıcılığı, auto-connect, izin sistemi (wildcard), app lock, çoklu panel.
- **Tam endpoint kaydı** (`src/api/endpoints.ts`): Clients, Services, Orders, Invoices, Tickets,
  Financial, Notifications, Reference ailelerinin resmi yolları (method+path+permission) tek dosyada.
- Dashboard: 6 KPI, ödenmemiş banner, son müşteriler/faturalar, pull-to-refresh.
- Müşteriler: liste (arama+filtre+sonsuz kaydırma), detay (özet, güven skoru, rozetler, bilgiler,
  **krediler, notlar+ekle, hizmetler linki**), **işlem menüsü** (düzenle, engelle/kaldır, fatura
  hatırlat, hizmetleri askıya al/aç/iptal), yeni müşteri oluştur, **düzenle (PATCH)**.
- Hizmetler: liste + detay, **yetenek-bazlı işlemler** (askıya al/aç/yeniden kur/iptal/yenileme faturası).
- Finans: Faturalar + Siparişler. Fatura işlemleri (**durum değiştir, ödeme ekle, hatırlat, resmileştir**).
  Sipariş işlemleri (**durum değiştir, sil**).
- Destek Talepleri: filtreli liste, detay (mesaj thread'i), yanıt + dahili not, durum+öncelik değiştir.
- Diğer: aktif panel, Yönetim (Destek Talepleri, Hizmetler), panel yönetimi, app lock, bağlantıyı kes.

## Backlog (öncelikli)
- P1: Müşteri alt kaynakları UI (adresler CRUD, alt kullanıcılar, kartlar, whois, GDPR, belgeler).
- P1: Hizmet alt kaynakları (addon, domain DNS/nameserver, upgrade/downgrade, metrikler, araçlar).
- P2: Faturalandırma (kuponlar, kurlar, vergi), Bildirim şablonları, yeni sipariş/fatura/ticket oluşturma.
- P2: Polling tabanlı yerel bildirim, SSL pinning, i18n.
- Not: Tüm bu alanların endpoint'leri `endpoints.ts`'te kayıtlı ve `apiRequest(buildPath(...))` ile çağrılabilir; UI kademeli ekleniyor.

## Notes
- expo-secure-store web'de çalışmaz (web önizlemede oturum reload'da kaybolur) — gerçek cihazda kalıcı.
- WISECP API CORS `*` açık; doğrudan çağrı hem cihazda hem web'de çalışır.
- Güvenlik: uygulama tamamlandığında panelden admin API anahtarını yenilemek önerilir.

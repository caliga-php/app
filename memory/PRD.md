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
- Çekirdek: Connect ekranı, oturum kalıcılığı, auto-connect, izin sistemi, app lock, çoklu panel.
- Dashboard: 6 KPI (müşteri, aktif hizmet, ödenmemiş fatura, kredi bakiyesi, açık talep, sipariş),
  ödenmemiş banner, son müşteriler, son faturalar, pull-to-refresh.
- Müşteriler: liste (arama + durum filtresi, sonsuz kaydırma), detay (özet, güven skoru, rozetler,
  bilgiler), yeni müşteri oluşturma (POST /clients, full_name zorunlu).
- Finans: Faturalar + Siparişler segmenti, durum filtreleri, detaylar (kalemler, ödemeler, hizmetler).
- Destek Talepleri: filtreli liste, detay (mesaj thread'i), Yanıt gönderme, Dahili Not ekleme,
  durum + öncelik değiştirme.
- Diğer: aktif panel, panel yönetimi, uygulama kilidi, bağlantıyı kes.

## Backlog (öncelikli)
- P1: Hizmetler (Services) modülü — liste/detay, askıya al/aç/iptal, yenileme.
- P1: Müşteri işlemleri — düzenle (PUT), engelle/engeli kaldır, hizmet askıya alma (cihazda doğrula).
- P2: Bilgi Bankası, Web Sitesi, Ayarlar, Araçlar, Otomasyon, Personel, Diller, Modüller.
- P2: Yeni ticket oluşturma, ek dosya, atama değiştirme.
- P2: Polling tabanlı yerel bildirim (yeni ticket/yanıt), SSL pinning, i18n.

## Notes
- expo-secure-store web'de çalışmaz (web önizlemede oturum reload'da kaybolur) — gerçek cihazda kalıcı.
- WISECP API CORS `*` açık; doğrudan çağrı hem cihazda hem web'de çalışır.
- Güvenlik: uygulama tamamlandığında panelden admin API anahtarını yenilemek önerilir.

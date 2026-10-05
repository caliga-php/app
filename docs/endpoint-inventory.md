# WISECP Admin API — Doğrulanmış Endpoint Envanteri

Base URL: `https://{panel}/api/v1/admin`
Auth: `Authorization: Bearer wak_...`
Zarf: `{ "data": ..., "meta": {...} }` / hata `{ "error": { code, message, details } }`
Sayfalama: `page` + `limit` (varsayılan 25, max 100), `meta.total`, `meta.next_page` (son sayfada 0)
Rate limit: 120/dk (admin). Başlıklar: `X-RateLimit-Limit/Remaining/Reset`, 429 → `Retry-After`.
Arama: `keyword`, filtre: `status`.

Tümü vexa.net.tr üzerinde canlı doğrulandı (sadece okuma + güvenli 422 doğrulaması).

## System / Health
| Metod | Yol | İzin | Not |
|---|---|---|---|
| GET | /ping | System/Ping (anahtarsız) | {pong, version, time} |
| GET | /whoami | System/Whoami (scope yok) | {id, type, name, permissions[], last_access} |

## Reference (etiket sözlükleri)
| GET | /reference/currencies | Reference/GetCurrencies | [{id, code, name, is_default}] |
| GET | /reference/countries?lang | Reference/GetCountries | [{id, code, name}] |
| GET | /reference/states?country_id | Reference/GetStates | [{id, name}] |
| GET | /reference/cities?state_id | Reference/GetCities | [{id, name}] |
| GET | /reference/languages | Reference/GetLanguages | [{code, name}] |
| GET | /reference/cycles?lang | Reference/GetCycles | [{code, label}] |
| GET | /reference/statuses?entity=client|product | Reference/GetStatuses | {entity, statuses:[{value,label}]} |

## Clients
| GET | /clients?page&limit&keyword&status | Clients/GetClients | liste satırı: id, full_name, company_name, email, phone, status, language, country_code, currency_code, group, email_verified, phone_verified, active_services, created_at, last_login_at |
| GET | /clients/stats | Clients/GetClientsStats | active, blocked, new, blacklisted, active_services, unpaid_invoices, credit_balance(_formatted), growth_rate, total |
| GET | /clients/search?q | Clients/SearchClients | [{id, full_name, company_name, text}] |
| GET | /clients/{id} | Clients/GetClient | id, full_name, name, surname, company_name, email, phone, status, language, country_id, currency_id, group_id, balance, created_at, last_login_at |
| GET | /clients/{id}/summary | Clients/GetClientSummary | total_revenue, revenue_currency, paid_invoices, active_services, inactive_services, total_tickets, badges{}, trust_score{total,label,...} |
| POST | /clients  (body: full_name*, email, ...) | Clients/CreateClient | 422 full_name_required doğrulandı |
| PUT | /clients/{id} | Clients/UpdateClient | REST konvansiyonu |
| POST | /clients/{id}/block (body blocked:bool) | Clients/SetClientBlock | * yazma - cihazda doğrulanacak |

## Orders
| GET | /orders?page&limit&status | Orders/GetOrders | id, order_number, status, amount, currency_id, payment_method, invoice_id, invoice_status, item_count, ip, created_at, client{} |
| GET | /orders/{id} | Orders/GetOrder | + taxes, discounts, details, items[], services[], invoice{} |

## Invoices
| GET | /invoices?page&limit&status | Invoices/GetInvoices | id, number, status, currency_id, subtotal, tax, total, formalized, payment_method, created_at, due_date, paid_at, refund_date, client{} |
| GET | /invoices/stats | Invoices/GetInvoiceStats | type, period, amount, count, currency_id |
| GET | /invoices/{id} | Invoices/GetInvoice | + total_paid, balance, items[], payments[], user_data{}, discounts{} |

## Services (dashboard/müşteri detayında okunur)
| GET | /services?page&limit | Services/GetServices | id, name, type, domain, status, amount, currency_id, cycle, qty, client{}, due_at, renewal_at |

## Tickets (dashboard KPI)
| GET | /tickets?page&limit | Tickets/GetTickets | id, reference, subject, status, priority, department{}, client{}, last_reply{} |
| GET | /tickets/stats | Tickets/GetTicketStats | open, process, pending, answered, resolved, total, resolution_rate |

Not: Yazma alt-işlem yolları (block/suspend vb.) herkese açık dokümanda yok; REST konvansiyonuyla eklendi, gerçek cihazda doğrulanmalı.

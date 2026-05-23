# Trade Journal — Project Progress

## App info
- **URL**: https://trade-journal-zeta-seven.vercel.app
- **Repo**: https://github.com/ceyfi/trade-journal
- **Stack**: React (CRA), Express, Supabase, LemonSqueezy, Vercel
- **Branch**: main → auto-deploy na Vercel

## Šta je napravljeno

### Auth
- Supabase email/password login i signup
- Token u localStorage

### Trade journal
- Log trade (asset, direction, entry/target/stop, thesis)
- AI feedback na svaki trejd (Claude Sonnet preko /api/claude)
- Dashboard sa statistikama (win rate, adherence rate)
- Open / closed trejdovi
- Review screen

### Plaćanje (LemonSqueezy)
- `/api/lemon-checkout` — kreira checkout sesiju
- `/api/lemon-webhook` — prima webhookove, ažurira Supabase `profiles` tabelu
- Polja u profiles: `subscription_status`, `lemon_customer_id`, `lemon_subscription_id`
- Webhook obrađuje: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`

### Freemium model (zadnje urađeno)
- Prvih 5 trejdova besplatno, od 6. paywall
- Counter u headeru: "X/5 free" (postaje crven na limitu)
- `FREE_LIMIT = 5` konstanta na vrhu App.js — lako promijeniti
- PaywallScreen se prikazuje samo kad korisnik pokuša logirati 6. trejd
- Tekst: "You've used all 5 free trades" + dugme za $5/month

## Poznati problemi / napomene
- `.env` fajl nije u `.gitignore` — treba provjeriti da se ne commituje API ključevi
- LemonSqueezy trial period nije konfigurisan (za sada freemium, bez triala)
- `subscription_status = 'on_trial'` nije obrađen u webhook handleru (ne potrebno sada)

## Sljedeće ideje (nisu implementirane)
- [ ] Landing page sa screenshotima app-a
- [ ] Ručno postavljanje pretplate u Supabase: `UPDATE profiles SET subscription_status = 'active' WHERE id = 'uuid';`
- [ ] Poboljšati onboarding (prvi ekran kad se neko uloguje)
- [ ] Email notifikacije
- [ ] Mobile optimizacija

## Kako raditi na projektu
1. Otvori Cowork i učitaj folder `I:\Apps\trade-journal-main`
2. Reci Claudeu: "pročitaj PROGRESS.md i nastavi gdje smo stali"
3. Na kraju sesije: commit PROGRESS.md zajedno sa ostalim izmjenama

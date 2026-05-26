# Trade Journal — Project Progress

## App info
- **URL**: https://trade-journal-zeta-seven.vercel.app
- **Repo**: https://github.com/ceyfi/trade-journal
- **Stack**: React (CRA), Express, Supabase, LemonSqueezy, Vercel
- **Branch**: main → auto-deploy na Vercel

---

## Šta je napravljeno

### Auth
- Supabase email/password login i signup
- Token u localStorage
- Password reset: "Forgot password?" → Supabase šalje link → app detektuje `#type=recovery` → forma za novu lozinku

### Trade journal
- Log trade (asset, direction, entry/target/stop, thesis)
- AI feedback na svaki trejd (Claude Sonnet preko /api/claude)
- Dashboard sa statistikama (win rate, adherence rate)
- Open / closed trejdovi
- Review screen
- Custom strategije (Supabase tabela `strategies`, RLS policy)

### Plaćanje (LemonSqueezy)
- `/api/lemon-checkout` — kreira checkout sesiju
- `/api/lemon-webhook` — prima webhookove, ažurira Supabase `profiles` tabelu
- Polja u profiles: `subscription_status`, `lemon_customer_id`, `lemon_subscription_id`
- Webhook obrađuje: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`

### Freemium model
- Prvih 5 trejdova besplatno, od 6. paywall
- Counter u headeru: "X/5 free" (postaje crven na limitu, uvijek klikabilan)
- `FREE_LIMIT = 5` konstanta na vrhu App.js — lako promijeniti
- Klik na counter pokazuje paywall sa različitim tekstom zavisno jesi li na limitu ili ne
- PaywallScreen redesajniran da prati dizajn sistem app-a

### Sigurnost
- `.env` uklonjen iz git trackinga, dodan u `.gitignore`
- Anthropic API ključ rotiran (novi ključ postavljen lokalno i na Vercelu)

### UI poboljšanja
- Dashboard metric labele: veće (12px), čitljivija boja, Syne font — vrijednosti u Space Mono
- Sve labele ujednačene kroz cijelu app (section-label, detail-label, claude-label, review-card-label)
- Input polja: font 16px, placeholder vidljiviji
- PaywallScreen: potpuno redesajniran
- Auth ekran: hero sekcija iznad login/signup forme

### Hero sekcija na login/signup (zadnje urađeno)
- Naslov: "Stop trading on impulse. Start trading with a plan."
- Kratki opis + 3 bullet featura
- "Free for your first 5 trades. No credit card needed."
- Prikazuje se samo na login i signup — forgot/reset ostaju čisti

---

## Poznate napomene
- LemonSqueezy trial period nije konfigurisan (za sada freemium, bez triala)
- `subscription_status = 'on_trial'` nije obrađen u webhook handleru (ne potrebno sada)
- Email reset lozinke dolazi od Supabase adrese — kad bude zvanično, podesiti custom SMTP
  → Supabase → Project Settings → Authentication → SMTP Settings (preporučen Resend.com)
- Ručno postavljanje pretplate u Supabase:
  `UPDATE profiles SET subscription_status = 'active' WHERE id = 'uuid';`
- `src/App - Copy.js` stari backup fajl — može se obrisati

---

## Distribucija / marketing status
- Reddit r/Daytrading: post uklonjen, Software Sunday jedina opcija (nedjelja, flair)
- Twitter: postoji crypto/trading nalog, plan je koristiti ga
  - Promijeniti bio u: "trader | building tools for discipline | link u profilu"
  - Staviti link app-a u profil
  - Početi postovati: trade breakdowni, AI feedback screenshoti, psychology
  - Ne stavljati link u prvi tweet, čekati da neko pita

---

## Sljedeće (prioritet redom)
- [ ] **Poboljšati unos trejda** — Marko ima konkretne napomene, pitati na početku sesije
- [ ] Twitter bio + prvi tweet (van app-a, Markov zadatak)
- [ ] Review ekran — provjeriti fontove i UX
- [ ] Poboljšati onboarding

---

## Kako raditi na projektu
1. Otvori Cowork i učitaj folder `I:\Apps\trade-journal-main`
2. Reci Claudeu: "pročitaj PROGRESS.md i nastavi gdje smo stali"
3. Na kraju sesije: commit PROGRESS.md zajedno sa ostalim izmjenama

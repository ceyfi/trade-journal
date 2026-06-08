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
- `/api/lemon-webhook` — prima webhookove, UPSERT u Supabase `profiles` tabelu
- Polja u profiles: `subscription_status`, `lemon_customer_id`, `lemon_subscription_id`
- Webhook obrađuje: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`

### Trial model
- 10 dana besplatno od registracije (`TRIAL_DAYS = 10` u App.js)
- Counter u headeru: "X days left" / "Trial ended"
- Nakon 10 dana → PaywallScreen

### Sigurnost
- `.env` uklonjen iz git trackinga, dodan u `.gitignore`
- Anthropic API ključ rotiran (novi ključ postavljen lokalno i na Vercelu)
- `/api/claude` zaštićen — Supabase JWT provjera (neautorizovani zahtjevi dobiju 401)
- `askClaude()` i `parseTradeFromImage()` šalju Bearer token u svakom zahtjevu

### Bug fixes (sesija 3)
- **Webhook UPSERT** — `lemon-webhook.js` sada radi UPSERT umjesto PATCH, kreira `profiles` red za nove korisnike koji nemaju postojeći red
- **`closeTrade` finally bug** — `onClose()` se više ne poziva ako Supabase save ne uspije; korisnik dobije grešku umjesto tihog gubitka podataka
- **Dupli `loadTrades`** — uklonjen redundantni `useEffect` koji je pozivao `loadTrades()` pri promjeni `user`, pošto `checkSubscription()` to već radi
- **server.js TLS** — uklonjen `NODE_TLS_REJECT_UNAUTHORIZED = '0'`
- **Backup fajlovi** — `src/App - Copy.js` i `src/App - Copy (2).js` obrisani

### UI poboljšanja
- Dashboard metric labele: veće (12px), čitljivija boja, Syne font — vrijednosti u Space Mono
- Sve labele ujednačene kroz cijelu app (section-label, detail-label, claude-label, review-card-label)
- Input polja: font 16px, placeholder vidljiviji
- PaywallScreen: potpuno redesajniran
- Auth ekran: hero sekcija iznad login/signup forme

---

## Poznate napomene
- Token expiry nije riješen — JWT ističe za 1h, nema refresh logike. Korisnik mora da se odjavi/prijavi. (Pravi fix: migracija na `@supabase/supabase-js`)
- Nema profile reda za nove korisnike dok se ne pretplate (webhook sada radi UPSERT pa je ovo OK)
- Email reset lozinke dolazi od Supabase adrese — kad bude zvanično, podesiti custom SMTP
  → Supabase → Project Settings → Authentication → SMTP Settings (preporučen Resend.com)
- Ručno aktiviranje pretplate za alfa testere:
  ```sql
  UPDATE profiles SET subscription_status = 'active' WHERE id = 'uuid';
  -- ili po emailu:
  SELECT id FROM auth.users WHERE email = 'korisnik@email.com';
  ```

---

## Distribucija / marketing status
- Reddit r/Daytrading: Software Sunday jedina opcija (nedjelja, flair obavezan)
- Post je bio živ, 493 viewova, komentari bez negativnih reakcija
- Twitter: postoji crypto/trading nalog (@ficeyftw)
  - Plan: bio → "trader | building tools for discipline", link u profilu
  - Content: trade breakdowni, AI feedback screenshoti, psychology

---

## Sljedeće (prioritet redom)
- [ ] **Poboljšati unos trejda** — Marko ima konkretne napomene, pitati na početku sesije
- [ ] Token refresh / migracija na `@supabase/supabase-js`
- [ ] Review ekran — provjeriti fontove i UX
- [ ] Twitter bio + prvi tweet (van app-a, Markov zadatak)
- [ ] Naći prvih 10 alfa testera

---

## Kako raditi na projektu
1. Otvori Cowork i učitaj folder `I:\Apps\trade-journal-main`
2. Reci Claudeu: "pročitaj PROGRESS.md i nastavi gdje smo stali"
3. Na kraju sesije: commit PROGRESS.md zajedno sa ostalim izmjenama

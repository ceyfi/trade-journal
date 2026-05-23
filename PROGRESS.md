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

### Freemium model
- Prvih 5 trejdova besplatno, od 6. paywall
- Counter u headeru: "X/5 free" (postaje crven na limitu, uvijek klikabilan)
- `FREE_LIMIT = 5` konstanta na vrhu App.js — lako promijeniti
- Klik na counter pokazuje paywall sa različitim tekstom zavisno jesi li na limitu ili ne
- PaywallScreen redesajniran da prati dizajn sistem app-a (Space Mono font, zelena cijena, feature opisi)

### Sigurnost
- `.env` uklonjen iz git trackinga, dodan u `.gitignore`
- Anthropic API ključ rotiran (novi ključ postavljen lokalno i na Vercelu)

### UI poboljšanja
- Dashboard metric labele: veće (12px), čitljivija boja, Syne font — vrijednosti u Space Mono
- PaywallScreen: potpuno redesajniran da prati dizajn sistem

### Password reset (zadnje urađeno)
- "Forgot password?" link na login ekranu
- Ekran za unos emaila → Supabase šalje reset link
- Kad korisnik klikne link iz maila, app detektuje `#type=recovery` u URL-u i prikazuje formu za novu lozinku
- Nakon promjene lozinke redirect na login

## Poznate napomene
- LemonSqueezy trial period nije konfigurisan (za sada freemium, bez triala)
- `subscription_status = 'on_trial'` nije obrađen u webhook handleru (ne potrebno sada)
- Email resetlozinke dolazi od Supabase adrese — kad bude zvanično, podesiti custom SMTP u Supabase → Project Settings → Authentication → SMTP Settings (preporučen Resend.com, besplatan plan)
- Ručno postavljanje pretplate u Supabase: `UPDATE profiles SET subscription_status = 'active' WHERE id = 'uuid';`

## Sljedeće ideje (nisu implementirane)
- [ ] Poboljšati unos trejda (Marko ima konkretne napomene — pitati na početku sljedeće sesije)
- [ ] Pregledati sve ekrane i ujednačiti font veličine i stilove
- [ ] Landing page sa screenshotima app-a
- [ ] Poboljšati onboarding (prvi ekran kad se neko uloguje)

## Kako raditi na projektu
1. Otvori Cowork i učitaj folder `I:\Apps\trade-journal-main`
2. Reci Claudeu: "pročitaj PROGRESS.md i nastavi gdje smo stali"
3. Na kraju sesije: commit PROGRESS.md zajedno sa ostalim izmjenama

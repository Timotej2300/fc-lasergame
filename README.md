# LaserGame FaceClub

Rezervačný systém pre príležitostné LaserGame eventy v mládežníckom klube FaceClub.

Stack: Next.js (App Router, TypeScript) · Tailwind CSS · Supabase (PostgreSQL + Realtime) · Stripe · Vercel.

## Routes

- `/` — online rezervácia
- `/prihlassa` — kiosk (tablet vo FaceClube, platba v hotovosti)
- `/poradie` — verejná TV obrazovka s aktuálnym poradím
- `/admin` — admin panel (login kódom)

## 1. Inštalácia

```bash
npm install
```

## 2. Supabase setup

1. Vytvor nový projekt na [supabase.com](https://supabase.com).
2. V SQL editore spusti migrácie zo súboru `supabase/migrations/` v poradí:
   - `0001_init.sql`
   - `0002_rls.sql`
   - `0003_functions.sql`
   
   Alebo pomocou Supabase CLI:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
3. Skopíruj `Project URL`, `anon public key` a `service_role key` do `.env.local`.

## 3. Stripe setup

1. Vytvor Stripe účet a v Dashboard zapni Test mode.
2. Skopíruj `Secret key` a `Publishable key` do `.env.local`.
3. (Voliteľné) Vytvor fixný Price (1 €) a jeho ID vlož do `STRIPE_PRICE_ID` — ak ho nevyplníš, cena sa vytvorí dynamicky pri každom checkoute.
4. Nastav webhook (lokálne cez Stripe CLI, produkčne cez Dashboard) — pozri bod 9.

## 4. Environment variables

Skopíruj `.env.example` do `.env.local` a vyplň:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

ADMIN_ACCESS_CODE=34777422
ADMIN_SESSION_SECRET=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`ADMIN_ACCESS_CODE` a `SUPABASE_SERVICE_ROLE_KEY` sa nikdy neposielajú do klienta — používajú sa iba v server-side API routes.

## 5. Database migrations

Pozri bod 2 — migrácie sú v `supabase/migrations/`. Vytvárajú tabuľky, indexy, RLS politiky a SQL funkcie pre atomickú rezerváciu slotov (`reserve_slot`) a generovanie slotov (`generate_slots_for_event`).

## 6. Lokálne spustenie

```bash
npm run dev
```

Aplikácia beží na `http://localhost:3000`.

Pre lokálne testovanie Stripe webhookov:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Skopíruj vygenerovaný `whsec_...` do `STRIPE_WEBHOOK_SECRET`.

## 7. Prvé prihlásenie do admina

Choď na `/admin`, zadaj `ADMIN_ACCESS_CODE` (predvolene `34777422`, zmeň v produkcii). Následne v sekcii **Event** vytvor prvý event — systém automaticky vygeneruje časové sloty.

## 8. Vercel deployment

```bash
vercel
```

V nastaveniach projektu na Vercel pridaj všetky environment variables z `.env.example`. Nastav `NEXT_PUBLIC_APP_URL` na produkčnú doménu.

## 9. Stripe webhook setup (produkcia)

1. V Stripe Dashboard → Developers → Webhooks → Add endpoint.
2. URL: `https://<tvoja-domena>/api/stripe/webhook`
3. Udalosti: `checkout.session.completed`, `checkout.session.async_payment_failed`, `charge.refunded`.
4. Skopíruj `Signing secret` do `STRIPE_WEBHOOK_SECRET` na Verceli.

## Databázové tabuľky

`events`, `game_slots`, `groups`, `players`, `teams`, `team_members`, `payments`, `game_sessions`, `settings`, `rules`, `admins`, `admin_sessions`.

## Bezpečnosť

- Row Level Security zapnuté na všetkých tabuľkách — verejný (anon) klient má iba read-only prístup k neutajovaným dátam.
- Všetky zápisy (rezervácie, admin akcie, platby) idú cez server-side API routes so service role kľúčom.
- Rezervácia slotu je atomická (`FOR UPDATE` + unikátny index) — pri súbežnej rezervácii rovnakého slotu jeden používateľ dostane chybu "Tento termín už nie je dostupný."
- Admin session je server-side (httpOnly cookie), nie je možné ju obísť cez localStorage.
- Stripe webhook overuje podpis (`stripe-signature`); rezervácia sa potvrdí až po úspešnom webhooku, nie po redirecte z Checkoutu.

# LEARN TO RIDE — Setup

## 1. Supabase — crea la tabella

Vai su supabase.com → il tuo progetto → SQL Editor → incolla questo:

```sql
create table tricks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  url text not null,
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now()
);

alter table tricks enable row level security;

create policy "Public read" on tricks for select using (true);
create policy "Service role write" on tricks for all using (auth.role() = 'service_role');
```

## 2. Supabase — crea il bucket storage

Storage → New bucket → nome: `tricks` → spunta "Public bucket"

Poi aggiungi le policy (Storage → Policies → New policy → Full customization):

- Nome: `Public read` / Operation: SELECT / Using: `bucket_id = 'tricks'`
- Nome: `Service upload` / Operation: INSERT / Check: `bucket_id = 'tricks'`  
- Nome: `Service delete` / Operation: DELETE / Using: `bucket_id = 'tricks'`

## 3. Configura le variabili d'ambiente

Rinomina `.env.local.example` in `.env.local` e riempilo:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_PASSWORD=scegli-una-password
```

Le chiavi le trovi su Supabase → Settings → API.

## 4. Avvia in locale

```bash
npm install
npm run dev
```

Apri http://localhost:3000

## 5. Deploy su Vercel

1. Carica la cartella su GitHub (nuovo repo)
2. Vai su vercel.com → New Project → importa il repo
3. Aggiungi le 4 variabili d'ambiente nel pannello Vercel
4. Deploy!

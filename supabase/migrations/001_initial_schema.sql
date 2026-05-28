-- MeuTreino — schema inicial

-- Perfis de usuário
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  objetivo text default 'hipertrofia', -- hipertrofia | emagrecimento | forca | condicionamento
  streak integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Usuário vê e edita apenas seu perfil"
  on public.profiles for all using (auth.uid() = id);

-- Fichas de treino
create table public.fichas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  letra text not null,       -- 'A', 'B', 'C' …
  nome text not null,        -- 'Push · Peito · Ombro · Tríceps'
  cor text default '#CCFF00',
  icone text default 'benchPress',
  duracao_min integer default 60,
  ordem integer default 0,
  created_at timestamptz default now()
);
alter table public.fichas enable row level security;
create policy "Fichas do usuário"
  on public.fichas for all using (auth.uid() = user_id);

-- Exercícios de cada ficha
create table public.exercicios (
  id uuid primary key default gen_random_uuid(),
  ficha_id uuid references public.fichas(id) on delete cascade not null,
  nome text not null,
  grupo text,
  series integer default 3,
  reps text default '10-12',
  carga numeric default 0,
  descanso integer default 60,  -- segundos
  tipo text default 'forca',    -- forca | iso | cardio
  duracao_seg integer,          -- para iso
  duracao_min integer,          -- para cardio
  intensidade text,             -- para cardio
  yt_id text,
  ordem integer default 0,
  created_at timestamptz default now()
);
alter table public.exercicios enable row level security;
create policy "Exercícios via ficha do usuário"
  on public.exercicios for all
  using (exists (
    select 1 from public.fichas f
    where f.id = ficha_id and f.user_id = auth.uid()
  ));

-- Sessões de treino completadas
create table public.treinos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  ficha_id uuid references public.fichas(id) on delete set null,
  ficha_letra text,
  data date not null default current_date,
  duracao_min integer,
  volume_total numeric default 0,
  teve_pr boolean default false,
  created_at timestamptz default now()
);
alter table public.treinos enable row level security;
create policy "Treinos do usuário"
  on public.treinos for all using (auth.uid() = user_id);

-- Log individual de séries
create table public.sets_log (
  id uuid primary key default gen_random_uuid(),
  treino_id uuid references public.treinos(id) on delete cascade not null,
  exercicio_id uuid references public.exercicios(id) on delete set null,
  exercicio_nome text,  -- denormalizado para resiliência
  serie_num integer not null,
  carga numeric,
  reps integer,
  duracao_seg integer,
  done boolean default true,
  created_at timestamptz default now()
);
alter table public.sets_log enable row level security;
create policy "Sets via treino do usuário"
  on public.sets_log for all
  using (exists (
    select 1 from public.treinos t
    where t.id = treino_id and t.user_id = auth.uid()
  ));

-- Medidas corporais
create table public.medidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  data date not null default current_date,
  peso numeric,
  altura numeric,
  gordura numeric,
  braco_d numeric,
  braco_e numeric,
  peito numeric,
  cintura numeric,
  quadril numeric,
  coxa_d numeric,
  coxa_e numeric,
  panturrilha numeric,
  created_at timestamptz default now()
);
alter table public.medidas enable row level security;
create policy "Medidas do usuário"
  on public.medidas for all using (auth.uid() = user_id);

-- Trigger: atualiza updated_at em profiles
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger on_profiles_update
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Trigger: cria perfil vazio ao registrar usuário
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

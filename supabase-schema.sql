create table if not exists cakes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  category text not null,
  description text,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  icon text,
  time_label text not null,
  title text not null,
  description text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  content text not null,
  avatar_url text,
  created_at timestamptz default now()
);

alter table cakes enable row level security;
alter table categories enable row level security;
alter table milestones enable row level security;
alter table testimonials enable row level security;

drop policy if exists "Public can view cakes" on cakes;
drop policy if exists "Admins can manage cakes" on cakes;
drop policy if exists "Public can view categories" on categories;
drop policy if exists "Admins can manage categories" on categories;
drop policy if exists "Public can view milestones" on milestones;
drop policy if exists "Admins can manage milestones" on milestones;
drop policy if exists "Public can view testimonials" on testimonials;
drop policy if exists "Admins can manage testimonials" on testimonials;

create policy "Public can view cakes" on cakes for select to anon, authenticated using (true);
create policy "Admins can manage cakes" on cakes for all to authenticated using (true) with check (true);
create policy "Public can view categories" on categories for select to anon, authenticated using (true);
create policy "Admins can manage categories" on categories for all to authenticated using (true) with check (true);
create policy "Public can view milestones" on milestones for select to anon, authenticated using (true);
create policy "Admins can manage milestones" on milestones for all to authenticated using (true) with check (true);
create policy "Public can view testimonials" on testimonials for select to anon, authenticated using (true);
create policy "Admins can manage testimonials" on testimonials for all to authenticated using (true) with check (true);

insert into categories (name) values ('Classic'), ('Seasonal'), ('Celebration') on conflict (name) do nothing;
insert into cakes (name, price, category, description, image_url)
select * from (values
  ('Strawberry wish', 42, 'Seasonal', 'Vanilla sponge, strawberry compote, and a cloud of cream.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85'),
  ('Midnight chocolate', 38, 'Classic', 'Deep cocoa layers, salted caramel, and glossy ganache.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85'),
  ('Lemon bloom', 36, 'Classic', 'Bright lemon curd, soft sponge, and sugared petals.', 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=900&q=85'),
  ('Velvet number', 45, 'Celebration', 'Red velvet, whipped cream cheese, and a little drama.', 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=900&q=85'),
  ('Pistachio picnic', 40, 'Seasonal', 'Roasted pistachio, raspberry jam, and tender olive oil cake.', 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=900&q=85'),
  ('Party cake', 48, 'Celebration', 'Vanilla funfetti, buttercream swirls, and extra sprinkles.', 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=900&q=85')
) as defaults(name, price, category, description, image_url)
where not exists (select 1 from cakes);
insert into milestones (icon, time_label, title, description, sort_order)
select * from (values
  ('✦', '2019', 'A little kitchen', 'Where a love for soft sponge, bright fruit, and generous frosting first began.', 0),
  ('✿', '2021', 'More reasons to celebrate', 'Word spread, orders grew, and every cake became part of someone''s sweetest day.', 1),
  ('♡', 'Today', 'Made with intention', 'Small-batch bakes, carefully finished and made to feel like they belong to your people.', 2),
  ('✦', 'And then...', 'Happily ever after', 'There is always room for one more slice.', 3)
) as defaults(icon, time_label, title, description, sort_order)
where not exists (select 1 from milestones);

insert into testimonials (author_name, content)
select * from (values
  ('Sarah M.', 'The most beautiful and delicious cake for our daughter''s 1st birthday!'),
  ('James & Lily', 'Everyone asked where the cake was from. Absolutely stunning.'),
  ('Chloe T.', 'Not too sweet, just perfect. The sponge was incredibly soft.')
) as defaults(author_name, content)
where not exists (select 1 from testimonials);

drop policy if exists "Public can view cake images" on storage.objects;
drop policy if exists "Admins can upload cake images" on storage.objects;
drop policy if exists "Admins can update cake images" on storage.objects;
drop policy if exists "Admins can delete cake images" on storage.objects;

create policy "Public can view cake images" on storage.objects for select to anon, authenticated using (bucket_id = 'cake-images');
create policy "Admins can upload cake images" on storage.objects for insert to authenticated with check (bucket_id = 'cake-images');
create policy "Admins can update cake images" on storage.objects for update to authenticated using (bucket_id = 'cake-images') with check (bucket_id = 'cake-images');
create policy "Admins can delete cake images" on storage.objects for delete to authenticated using (bucket_id = 'cake-images');

-- Allow authenticated users to create their own profile row if the trigger did not run.

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

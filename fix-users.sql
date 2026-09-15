-- ============================================
-- FIX: Insertar usuario + Recrear trigger
-- ============================================

-- 1. Insertar el usuario actual en users
INSERT INTO users (id, email, full_name, phone, role, status)
VALUES (
  '966ff113-ac87-40b0-9596-0e7f77c18f7c',
  'jhordammv@gmail.com',
  'Jhordam Aguilera',
  '+58 4121196560',
  'admin',
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Recrear trigger handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Verificar
SELECT id, email, role, full_name FROM users;

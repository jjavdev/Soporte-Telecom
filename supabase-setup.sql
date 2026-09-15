-- ============================================
-- SUPABASE SETUP - Soporte al Cliente Telecom
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Idempotente: se puede ejecutar múltiples veces
-- ============================================

-- ============================================
-- 1. TIPOS ENUM (DROP si existen)
-- ============================================

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS ticket_priority CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS comment_type CASCADE;

CREATE TYPE user_role AS ENUM ('customer', 'agent', 'supervisor', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE comment_type AS ENUM ('public', 'internal');

-- ============================================
-- 2. TRIGGERS y FUNCTIONS (DROP si existen)
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

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

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. TABLAS (DROP en orden por dependencias)
-- ============================================

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS knowledge_articles CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  phone VARCHAR,
  role user_role DEFAULT 'customer',
  status user_status DEFAULT 'active',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CATEGORIES
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  icon VARCHAR,
  slug VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TICKETS
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  priority ticket_priority DEFAULT 'medium',
  status ticket_status DEFAULT 'open',
  sla_deadline TIMESTAMP WITH TIME ZONE,
  satisfaccion INTEGER CHECK (satisfaccion >= 1 AND satisfaccion <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- COMMENTS
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type comment_type DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- KNOWLEDGE_ARTICLES
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  slug VARCHAR UNIQUE NOT NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CHAT_SESSIONS
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CHAT_MESSAGES
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 4. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tickets_client_id ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agent_id ON tickets(agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category_id ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON knowledge_articles(category_id);

-- ============================================
-- 5. HABILITAR RLS
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. POLÍTICAS RLS (DROP + CREATE)
-- ============================================

-- USERS
-- USERS (sin self-reference para evitar recursión)
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_select_all_auth" ON users;
CREATE POLICY "users_select_all_auth" ON users FOR SELECT USING (auth.role() = 'authenticated');

-- CATEGORIES
DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "categories_admin_all" ON categories;
CREATE POLICY "categories_admin_all" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- TICKETS
DROP POLICY IF EXISTS "tickets_client_select" ON tickets;
CREATE POLICY "tickets_client_select" ON tickets FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "tickets_client_insert" ON tickets;
CREATE POLICY "tickets_client_insert" ON tickets FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "tickets_agent_select" ON tickets;
CREATE POLICY "tickets_agent_select" ON tickets FOR SELECT USING (
  agent_id = auth.uid() OR
  status = 'open' OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('agent', 'supervisor', 'admin'))
);

DROP POLICY IF EXISTS "tickets_agent_update" ON tickets;
CREATE POLICY "tickets_agent_update" ON tickets FOR UPDATE USING (
  agent_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('agent', 'supervisor', 'admin'))
);

DROP POLICY IF EXISTS "tickets_admin_all" ON tickets;
CREATE POLICY "tickets_admin_all" ON tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- COMMENTS
DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = comments.ticket_id
    AND (
      tickets.client_id = auth.uid() OR
      tickets.agent_id = auth.uid() OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('supervisor', 'admin'))
    )
  )
);

DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (author_id = auth.uid());

-- KNOWLEDGE_ARTICLES
DROP POLICY IF EXISTS "knowledge_select_all" ON knowledge_articles;
CREATE POLICY "knowledge_select_all" ON knowledge_articles FOR SELECT USING (true);

DROP POLICY IF EXISTS "knowledge_insert_auth" ON knowledge_articles;
CREATE POLICY "knowledge_insert_auth" ON knowledge_articles FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('agent', 'admin'))
);

-- CHAT_SESSIONS
DROP POLICY IF EXISTS "chat_sessions_client" ON chat_sessions;
CREATE POLICY "chat_sessions_client" ON chat_sessions FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS "chat_sessions_agent" ON chat_sessions;
CREATE POLICY "chat_sessions_agent" ON chat_sessions FOR SELECT USING (
  agent_id = auth.uid() OR
  status = 'waiting' OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('agent', 'admin'))
);

DROP POLICY IF EXISTS "chat_sessions_create" ON chat_sessions;
CREATE POLICY "chat_sessions_create" ON chat_sessions FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "chat_sessions_update" ON chat_sessions;
CREATE POLICY "chat_sessions_update" ON chat_sessions FOR UPDATE USING (
  agent_id = auth.uid() OR
  client_id = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('agent', 'admin'))
);

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_sessions
    WHERE chat_sessions.id = chat_messages.session_id
    AND (
      chat_sessions.client_id = auth.uid() OR
      chat_sessions.agent_id = auth.uid() OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  )
);

DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK (sender_id = auth.uid());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- 7. HABILITAR REALTIME
-- ============================================

-- Primero quitar si ya existen en la publicación
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE chat_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE notifications; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE notifications; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- ============================================
-- 8. DATOS INICIALES
-- ============================================

-- Categorías (INSERT solo si no existen)
INSERT INTO categories (name, description, icon, slug)
SELECT * FROM (VALUES
  ('Internet', 'Problemas de conectividad a internet', 'wifi', 'internet'),
  ('Telefonía', 'Problemas de servicio telefónico', 'phone', 'telefonia'),
  ('Fibra Óptica', 'Problemas de fibra óptica', 'zap', 'fibra'),
  ('Corporativo', 'Servicios corporativos y empresas', 'building', 'corporativo')
) AS v(name, description, icon, slug)
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

-- ============================================
-- 9. TRIGGERS DE updated_at
-- ============================================

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_articles_updated_at ON knowledge_articles;
CREATE TRIGGER update_knowledge_articles_updated_at
  BEFORE UPDATE ON knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. AUTOMATIZACIONES NATIVAS (Supabase)
-- Sustituyen los workflows n8n 01/02/03.
-- Corren 100% en PostgreSQL, sin dependencias externas.
-- ============================================

-- ------------------------------------------------------------
-- 10.1 AUTO-ASIGNACIÓN DE AGENTE + SLA DEADLINE (BEFORE INSERT)
-- Al crear un ticket sin agente, asigna el agente activo con
-- menor carga y fija el plazo SLA según la prioridad.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS before_ticket_insert() CASCADE;

CREATE OR REPLACE FUNCTION before_ticket_insert()
RETURNS TRIGGER AS $$
DECLARE
  available_agent UUID;
BEGIN
  -- Fijar plazo SLA según prioridad si no viene definido
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline := now() + CASE NEW.priority
      WHEN 'urgent' THEN interval '1 hour'
      WHEN 'high'   THEN interval '4 hours'
      WHEN 'medium' THEN interval '24 hours'
      ELSE interval '72 hours'
    END;
  END IF;

  -- Auto-asignar agente si el ticket no tiene uno
  IF NEW.agent_id IS NULL THEN
    SELECT u.id INTO available_agent
    FROM users u
    WHERE u.role = 'agent' AND u.status = 'active'
    ORDER BY (
      SELECT COUNT(*) FROM tickets t
      WHERE t.agent_id = u.id AND t.status IN ('open', 'in_progress')
    ) ASC, u.created_at ASC
    LIMIT 1;

    IF available_agent IS NOT NULL THEN
      NEW.agent_id := available_agent;
      NEW.status := 'in_progress';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS before_ticket_insert_trigger ON tickets;
CREATE TRIGGER before_ticket_insert_trigger
  BEFORE INSERT ON tickets
  FOR EACH ROW EXECUTE FUNCTION before_ticket_insert();

-- ------------------------------------------------------------
-- 10.2 NOTIFICACIÓN IN-APP POR CAMBIO DE ESTADO (AFTER UPDATE)
-- Al cambiar el estado de un ticket, notifica al cliente.
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS notify_ticket_status() CASCADE;

CREATE OR REPLACE FUNCTION notify_ticket_status()
RETURNS TRIGGER AS $$
DECLARE
  status_label TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    status_label := CASE NEW.status
      WHEN 'open'        THEN 'Abierto'
      WHEN 'in_progress' THEN 'En progreso'
      WHEN 'resolved'    THEN 'Resuelto'
      WHEN 'closed'      THEN 'Cerrado'
      ELSE NEW.status
    END;

    INSERT INTO notifications (user_id, type, title, message)
    VALUES (
      NEW.client_id,
      'ticket_status',
      'Tu ticket cambió de estado',
      'El ticket "' || NEW.title || '" ahora está: ' || status_label || '.'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_ticket_status_trigger ON tickets;
CREATE TRIGGER notify_ticket_status_trigger
  AFTER UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION notify_ticket_status();

-- ------------------------------------------------------------
-- 10.3 ESCALAMIENTO POR SLA (pg_cron, cada 5 minutos)
-- Requiere habilitar la extensión pg_cron:
--   Supabase Dashboard > Database > Extensions > pg_cron
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS escalate_overdue_tickets() CASCADE;

CREATE OR REPLACE FUNCTION escalate_overdue_tickets()
RETURNS void AS $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT id, title, agent_id
    FROM tickets
    WHERE status IN ('open', 'in_progress')
      AND sla_deadline IS NOT NULL
      AND sla_deadline < now()
      AND priority <> 'urgent'
  LOOP
    UPDATE tickets SET priority = 'urgent', updated_at = now() WHERE id = t.id;

    IF t.agent_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (
        t.agent_id,
        'sla_escalation',
        'Ticket escalado por SLA',
        'El ticket "' || t.title || '" superó su plazo SLA y fue escalado a prioridad urgente.'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Programar el job (idempotente). Ejecutar DESPUÉS de habilitar pg_cron.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'escalar-sla') THEN
      PERFORM cron.unschedule('escalar-sla');
    END IF;
    PERFORM cron.schedule('escalar-sla', '*/5 * * * *', $$SELECT public.escalate_overdue_tickets()$$);
  END IF;
END $$;

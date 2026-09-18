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

DROP POLICY IF EXISTS "knowledge_update_admin" ON knowledge_articles;
CREATE POLICY "knowledge_update_admin" ON knowledge_articles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "knowledge_delete_admin" ON knowledge_articles;
CREATE POLICY "knowledge_delete_admin" ON knowledge_articles FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
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
-- 8.1 ARTÍCULOS DE BASE DE CONOCIMIENTO (seed)
-- ============================================
INSERT INTO knowledge_articles (title, content, category_id, slug, views)
SELECT * FROM (VALUES
  (
    'Cómo reiniciar tu módem correctamente',
    'Si tienes problemas de conectividad, reiniciar el módem es el primer paso:\n\n1. Apaga el módem presionando el botón de encendido o desconectándolo de la corriente.\n2. Espera 30 segundos para que los componentes se descarguen completamente.\n3. Conecta el módem nuevamente y enciéndelo.\n4. Espera 2-3 minutos a que todas las luces estén estables (POWER, DSL/FIBRA, INTERNET).\n5. Verifica tu conexión abriendo un navegador web.\n\nSi el problema persiste después de reiniciar, contacta a soporte.',
    (SELECT id FROM categories WHERE slug = 'internet'),
    'como-reiniciar-modem',
    0
  ),
  (
    'Cómo cambiar tu clave WiFi',
    'Para cambiar la contraseña de tu red WiFi:\n\n1. Abre un navegador y escribe 192.168.1.1 o 192.168.0.1 en la barra de direcciones.\n2. Ingresa con el usuario y contraseña del router (por defecto: admin/admin o está en la etiqueta del módem).\n3. Ve a la sección Wireless o WiFi Settings.\n4. Busca el campo Password o WPA Key.\n5. Escribe tu nueva contraseña (mínimo 8 caracteres, recomendado: combinación de letras, números y símbolos).\n6. Guarda los cambios y reconecta tus dispositivos con la nueva contraseña.',
    (SELECT id FROM categories WHERE slug = 'internet'),
    'como-cambiar-clave-wifi',
    0
  ),
  (
    'Mi internet va lento, ¿qué puedo hacer?',
    'Antes de reportar una falla, intenta estos pasos de diagnóstico:\n\n1. **Reinicia tu módem** (apaga, espera 30 segundos, enciende).\n2. **Verifica los cables** que estén bien conectados (ethernet y fibra óptica).\n3. **Acércate al módem** o acerca tu dispositivo al router para descartar problemas de señal.\n4. **Cierra aplicaciones** que consuman mucho ancho de banda (streaming, descargas pesadas).\n5. **Haz un speed test** en speedtest.net para medir tu velocidad real.\n6. **Prueba con otro dispositivo** para ver si el problema es del equipo o de la línea.\n\nSi después de estos pasos la velocidad sigue siendo baja, crea un ticket de soporte.',
    (SELECT id FROM categories WHERE slug = 'internet'),
    'internet-lento-soluciones',
    0
  ),
  (
    'Cómo consultar tu saldo y consumo',
    'Puedes consultar tu saldo de varias formas:\n\n**Por USSD (desde tu teléfono):**\n- Marca *265# y presiona llamar para ver tu saldo actual.\n\n**Por la app móvil:**\n- Descarga la app de Soporte Telecom desde Google Play o App Store.\n- Inicia sesión con tu número de teléfono y contraseña.\n- Ve a la sección "Mi Cuenta" para ver saldo, consumo y facturas.\n\n**Por llamada al IVR:**\n- Llama al *123 desde tu teléfono.\n- Sigue las indicaciones del menú para consultar saldo.\n\n**Por WhatsApp:**\n- Envía un mensaje al +58-XXX-XXXX con la palabra SALDO.',
    (SELECT id FROM categories WHERE slug = 'telefonia'),
    'consultar-saldo',
    0
  ),
  (
    'No tengo línea telefónica, causas comunes',
    'Si no tienes servicio de telefonía fija:\n\n1. **Verifica que el equipo esté conectado** correctamente a la toma de pared.\n2. **Comprueba si hay tono de línea** al levantar el auricular.\n3. **Reinicia el equipo** desconectándolo por 30 segundos.\n4. **Prueba con otro teléfono** para descartar que el equipo esté dañado.\n5. **Revisa si hay deudas pendientes** que puedan estar causando el corte del servicio.\n\nSi nenhumas de estas soluciones funciona, es probable que haya un corte en tu zona. Crea un ticket indicando tu dirección y número de teléfono.',
    (SELECT id FROM categories WHERE slug = 'telefonia'),
    'no-tengo-linea-telefonica',
    0
  ),
  (
    'Cómo pagar tu factura',
    'Tienes varias opciones para pagar tu factura:\n\n**Pago en línea:**\n- Ingresa a tu cuenta en el portal web de Soporte Telecom.\n- Ve a "Mis Facturas" y selecciona la que deseas pagar.\n- Elige tu método de pago (tarjeta de crédito, débito o transferencia).\n\n**Pago en efectivo:**\n- Acude a cualquier punto de pago autorizado con tu número de cliente.\n- Presenta tu factura impresa o el número de cliente.\n\n**Transferencia bancaria:**\n- Realiza una transferencia a la cuenta bancaria indicada en tu factura.\n- Incluye tu número de cliente en la referencia.\n- Envía el comprobante por WhatsApp o email.\n\n**Débito automático:**\n- Configura el débito automático desde tu cuenta en línea para no olvidar tus pagos.',
    (SELECT id FROM categories WHERE slug = 'corporativo'),
    'como-pagar-factura',
    0
  ),
  (
    'Problemas comunes de fibra óptica',
    'La fibra óptica puede presentar estos problemas:\n\n**Señal débil o intermitente:**\n- Verifica que el cable de fibra no esté doblado o aplastado (radio mínimo de curvatura: 3cm).\n- Revisa que el conector SC/APC esté limpio y bien conectado.\n- Asegúrate de que no haya polvo en el conector.\n\n**No hay señal:**\n- Verifica que el ONU/ONT esté encendido (luces PON y POWER estables).\n- Reinicia el ONU desconectándolo por 30 segundos.\n- Revisa si hay cortes en tu zona.\n\n**Velocidad baja:**\n- Conecta tu dispositivo directamente al ONU con cable ethernet.\n- Haz un speed test para verificar la velocidad real.\n- Verifica que no haya dispositivos consumiendo ancho de banda.\n\nSi el problema persiste, puede ser un corte en la fibra. Crea un ticket de soporte.',
    (SELECT id FROM categories WHERE slug = 'fibra'),
    'problemas-fibra-optica',
    0
  ),
  (
    'Servicios corporativos disponibles',
    'Ofrecemos servicios especializados para empresas:\n\n**Línea dedicada:**\n- Conexión simétrica con ancho de banda garantizado.\n SLA con tiempo de respuesta garantizado.\n- Ideal para oficinas y centros de datos.\n\n**VPN corporativa:**\n- Red privada virtual para conectar sedes.\n- Cifrado de extremo a extremo.\n- Soporte técnico prioritario.\n\n**Soporte prioritario:**\n- Atención dedicada con agente asignado.\n- Tiempo de respuesta en menos de 1 hora.\n- Disponible 24/7.\n\n**Cloud y hosting:**\n- Servidores en la nube para tu empresa.\n- Almacenamiento y respaldo automático.\n- Soporte técnico incluido.\n\nPara contratar o solicitar una cotización, contacta a nuestro equipo comercial al +58-XXX-XXXX o email corporativo@soportetelecom.com.',
    (SELECT id FROM categories WHERE slug = 'corporativo'),
    'servicios-corporativos',
    0
  )
) AS v(title, content, category_id, slug, views)
WHERE NOT EXISTS (SELECT 1 FROM knowledge_articles LIMIT 1);

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

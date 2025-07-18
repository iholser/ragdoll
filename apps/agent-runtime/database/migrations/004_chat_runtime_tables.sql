-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  session_id UUID,
  title VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived', 'escalated')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create workflow_conditions table
CREATE TABLE IF NOT EXISTS workflow_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('keyword', 'regex', 'sentiment', 'intent', 'length', 'metadata')),
  trigger_config JSONB NOT NULL DEFAULT '{}',
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('webhook', 'email', 'tag', 'escalate', 'custom_response')),
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

CREATE INDEX IF NOT EXISTS idx_workflow_conditions_agent_id ON workflow_conditions(agent_id);
CREATE INDEX IF NOT EXISTS idx_workflow_conditions_active ON workflow_conditions(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_conditions_trigger_type ON workflow_conditions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_conditions_priority ON workflow_conditions(priority DESC);

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_conditions_updated_at ON workflow_conditions;
CREATE TRIGGER update_workflow_conditions_updated_at
  BEFORE UPDATE ON workflow_conditions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add some default workflow conditions for demo purposes
INSERT INTO workflow_conditions (agent_id, name, trigger_type, trigger_config, action_type, action_config, priority)
VALUES 
  -- Keyword trigger example
  ('00000000-0000-0000-0000-000000000001', 'Urgent Keywords', 'keyword', 
   '{"keywords": ["urgent", "emergency", "asap", "critical"], "caseSensitive": false, "matchAll": false}',
   'tag', '{"tags": ["urgent", "priority"]}', 10),
  
  -- Length trigger example  
  ('00000000-0000-0000-0000-000000000001', 'Long Message Handler', 'length',
   '{"minLength": 500}',
   'custom_response', '{"responseTemplate": "I see you have a detailed question. Let me provide a comprehensive response.", "variables": {}}', 5),
   
  -- Regex trigger example
  ('00000000-0000-0000-0000-000000000001', 'Email Detection', 'regex',
   '{"pattern": "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", "flags": "i"}',
   'tag', '{"tags": ["contains_email"]}', 3)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON workflow_conditions TO your_app_user;

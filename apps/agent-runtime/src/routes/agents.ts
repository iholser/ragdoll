import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { query, transaction } from '../database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export const agentRoutes = async (fastify: FastifyInstance) => {
  // Get all agents for organization
  fastify.get('/', {
    schema: {
      description: 'Get all agents for the authenticated user\'s organization',
      tags: ['agents'],
      security: [{ bearerAuth: [] }],
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Array(Type.Object({
            id: Type.String({ format: 'uuid' }),
            name: Type.String(),
            description: Type.Optional(Type.String()),
            welcomeMessage: Type.String(),
            fallbackMessage: Type.String(),
            systemPrompt: Type.String(),
            isActive: Type.Boolean(),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' }),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const organizationId = request.user?.organizationId;
      
      if (!organizationId) {
        return reply.status(400).send({
          success: false,
          error: 'Organization ID required',
        });
      }

      const agents = await query(`
        SELECT 
          id,
          name,
          description,
          welcome_message as "welcomeMessage",
          fallback_message as "fallbackMessage",
          system_prompt as "systemPrompt",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM agents 
        WHERE organization_id = $1
        ORDER BY created_at DESC
      `, [organizationId]);

      return {
        success: true,
        data: agents,
      };
    } catch (error) {
      logger.error('Error fetching agents:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch agents',
      });
    }
  });

  // Get agent by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get agent by ID',
      tags: ['agents'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        id: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String({ format: 'uuid' }),
            name: Type.String(),
            description: Type.Optional(Type.String()),
            welcomeMessage: Type.String(),
            fallbackMessage: Type.String(),
            systemPrompt: Type.String(),
            isActive: Type.Boolean(),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const organizationId = request.user?.organizationId;

      const agents = await query(`
        SELECT 
          id,
          name,
          description,
          welcome_message as "welcomeMessage",
          fallback_message as "fallbackMessage",
          system_prompt as "systemPrompt",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM agents 
        WHERE id = $1 AND organization_id = $2
      `, [id, organizationId]);

      if (agents.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found',
        });
      }

      return {
        success: true,
        data: agents[0],
      };
    } catch (error) {
      logger.error('Error fetching agent:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch agent',
      });
    }
  });

  // Create new agent
  fastify.post('/', {
    schema: {
      description: 'Create a new agent',
      tags: ['agents'],
      security: [{ bearerAuth: [] }],
      body: Type.Object({
        name: Type.String({ minLength: 1, maxLength: 100 }),
        description: Type.Optional(Type.String()),
        welcomeMessage: Type.String({ minLength: 1 }),
        fallbackMessage: Type.String({ minLength: 1 }),
        systemPrompt: Type.String({ minLength: 1 }),
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        201: Type.Object({
          success: Type.Boolean(),
          data: Type.Object({
            id: Type.String({ format: 'uuid' }),
            name: Type.String(),
            description: Type.Optional(Type.String()),
            welcomeMessage: Type.String(),
            fallbackMessage: Type.String(),
            systemPrompt: Type.String(),
            isActive: Type.Boolean(),
            createdAt: Type.String({ format: 'date-time' }),
            updatedAt: Type.String({ format: 'date-time' }),
          }),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { name, description, welcomeMessage, fallbackMessage, systemPrompt, isActive = true } = request.body as any;
      const organizationId = request.user?.organizationId;

      if (!organizationId) {
        return reply.status(400).send({
          success: false,
          error: 'Organization ID required',
        });
      }

      const agentId = uuidv4();
      const now = new Date().toISOString();

      const result = await query(`
        INSERT INTO agents (
          id, name, description, welcome_message, fallback_message, 
          system_prompt, is_active, organization_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING 
          id,
          name,
          description,
          welcome_message as "welcomeMessage",
          fallback_message as "fallbackMessage",
          system_prompt as "systemPrompt",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, [agentId, name, description, welcomeMessage, fallbackMessage, systemPrompt, isActive, organizationId, now, now]);

      return reply.status(201).send({
        success: true,
        data: result[0],
      });
    } catch (error) {
      logger.error('Error creating agent:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create agent',
      });
    }
  });

  // Update agent
  fastify.put('/:id', {
    schema: {
      description: 'Update agent',
      tags: ['agents'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        id: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
        description: Type.Optional(Type.String()),
        welcomeMessage: Type.Optional(Type.String({ minLength: 1 })),
        fallbackMessage: Type.Optional(Type.String({ minLength: 1 })),
        systemPrompt: Type.Optional(Type.String({ minLength: 1 })),
        isActive: Type.Optional(Type.Boolean()),
      }),
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const organizationId = request.user?.organizationId;
      const updates = request.body as any;

      // Check if agent exists
      const existing = await query(`
        SELECT id FROM agents WHERE id = $1 AND organization_id = $2
      `, [id, organizationId]);

      if (existing.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found',
        });
      }

      // Build update query dynamically
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          const dbField = key === 'welcomeMessage' ? 'welcome_message' 
                        : key === 'fallbackMessage' ? 'fallback_message'
                        : key === 'systemPrompt' ? 'system_prompt'
                        : key === 'isActive' ? 'is_active'
                        : key;
          updateFields.push(`${dbField} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'No fields to update',
        });
      }

      // Add updated_at
      updateFields.push(`updated_at = $${paramIndex}`);
      values.push(new Date().toISOString());
      paramIndex++;

      // Add WHERE conditions
      values.push(id, organizationId);

      const result = await query(`
        UPDATE agents 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND organization_id = $${paramIndex + 1}
        RETURNING 
          id,
          name,
          description,
          welcome_message as "welcomeMessage",
          fallback_message as "fallbackMessage",
          system_prompt as "systemPrompt",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, values);

      return {
        success: true,
        data: result[0],
      };
    } catch (error) {
      logger.error('Error updating agent:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to update agent',
      });
    }
  });

  // Delete agent
  fastify.delete('/:id', {
    schema: {
      description: 'Delete agent',
      tags: ['agents'],
      security: [{ bearerAuth: [] }],
      params: Type.Object({
        id: Type.String({ format: 'uuid' }),
      }),
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const organizationId = request.user?.organizationId;

      const result = await query(`
        DELETE FROM agents 
        WHERE id = $1 AND organization_id = $2
        RETURNING id
      `, [id, organizationId]);

      if (result.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found',
        });
      }

      return {
        success: true,
        message: 'Agent deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting agent:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to delete agent',
      });
    }
  });
};

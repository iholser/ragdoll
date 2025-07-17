import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { query } from '../database';
import { logger } from '../utils/logger';

export const workflowRoutes = async (fastify: FastifyInstance) => {
  // Get all workflows for an agent
  fastify.get('/', {
    schema: {
      description: 'Get all workflows for an agent',
      tags: ['workflows'],
      security: [{ bearerAuth: [] }],
      querystring: Type.Object({
        agentId: Type.String({ format: 'uuid' }),
      }),
    },
  }, async (request, reply) => {
    try {
      const { agentId } = request.query as { agentId: string };
      const organizationId = request.user?.organizationId;

      // First verify the agent belongs to the organization
      const agentCheck = await query(`
        SELECT id FROM agents WHERE id = $1 AND organization_id = $2
      `, [agentId, organizationId]);

      if (agentCheck.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found',
        });
      }

      const workflows = await query(`
        SELECT 
          id,
          name,
          description,
          agent_id as "agentId",
          conditions,
          actions,
          is_active as "isActive",
          priority,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM workflows 
        WHERE agent_id = $1
        ORDER BY priority DESC, created_at DESC
      `, [agentId]);

      return {
        success: true,
        data: workflows,
      };
    } catch (error) {
      logger.error('Error fetching workflows:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch workflows',
      });
    }
  });

  // Create workflow (placeholder)
  fastify.post('/', async (request, reply) => {
    return reply.status(501).send({
      success: false,
      error: 'Not implemented yet',
    });
  });
};

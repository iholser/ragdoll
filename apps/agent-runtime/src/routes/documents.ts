import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { query } from '../database';
import { logger } from '../utils/logger';

export const documentRoutes = async (fastify: FastifyInstance) => {
  // Get all documents for an agent
  fastify.get('/', {
    schema: {
      description: 'Get all documents for an agent',
      tags: ['documents'],
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

      const documents = await query(`
        SELECT 
          id,
          filename,
          original_name as "originalName",
          mime_type as "mimeType",
          size,
          agent_id as "agentId",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM documents 
        WHERE agent_id = $1
        ORDER BY created_at DESC
      `, [agentId]);

      return {
        success: true,
        data: documents,
      };
    } catch (error) {
      logger.error('Error fetching documents:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch documents',
      });
    }
  });

  // Upload document (placeholder)
  fastify.post('/', async (request, reply) => {
    return reply.status(501).send({
      success: false,
      error: 'Not implemented yet',
    });
  });
};

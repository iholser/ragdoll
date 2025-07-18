import { logger } from '../utils/logger';
import { ActionResult, WorkflowCondition } from '../types/chat';
import { query } from '../database';

export class ActionEvaluator {
  /**
   * Evaluate workflow conditions and trigger actions based on message content
   */
  async evaluateAndExecute(
    agentId: string,
    messageContent: string,
    conversationId: string,
    metadata: Record<string, any> = {}
  ): Promise<ActionResult[]> {
    try {
      // Get workflow conditions for this agent
      const conditions = await this.getWorkflowConditions(agentId);
      const results: ActionResult[] = [];

      for (const condition of conditions) {
        if (await this.evaluateCondition(condition, messageContent, metadata)) {
          const result = await this.executeAction(condition, conversationId, messageContent, metadata);
          results.push(result);
        }
      }

      logger.debug({ 
        agentId, 
        conversationId, 
        evaluatedConditions: conditions.length,
        triggeredActions: results.length 
      }, 'Workflow conditions evaluated');

      return results;
    } catch (error) {
      logger.error({ error, agentId, conversationId }, 'Failed to evaluate workflow conditions');
      return [];
    }
  }

  /**
   * Get workflow conditions for an agent from database
   */
  private async getWorkflowConditions(agentId: string): Promise<WorkflowCondition[]> {
    const conditions = await query(`
      SELECT 
        id,
        name,
        trigger_type as "triggerType",
        trigger_config as "triggerConfig",
        action_type as "actionType",
        action_config as "actionConfig",
        is_active as "isActive",
        priority
      FROM workflow_conditions
      WHERE agent_id = $1 AND is_active = true
      ORDER BY priority DESC, created_at ASC
    `, [agentId]);

    return conditions.map(condition => ({
      ...condition,
      triggerConfig: typeof condition.triggerConfig === 'string' 
        ? JSON.parse(condition.triggerConfig) 
        : condition.triggerConfig,
      actionConfig: typeof condition.actionConfig === 'string'
        ? JSON.parse(condition.actionConfig)
        : condition.actionConfig
    }));
  }

  /**
   * Evaluate if a condition matches the current message
   */
  private async evaluateCondition(
    condition: WorkflowCondition,
    messageContent: string,
    metadata: Record<string, any>
  ): Promise<boolean> {
    const { triggerType, triggerConfig } = condition;

    switch (triggerType) {
      case 'keyword':
        return this.evaluateKeywordTrigger(triggerConfig, messageContent);
      
      case 'regex':
        return this.evaluateRegexTrigger(triggerConfig, messageContent);
      
      case 'sentiment':
        return this.evaluateSentimentTrigger(triggerConfig, messageContent);
      
      case 'intent':
        return this.evaluateIntentTrigger(triggerConfig, messageContent);
      
      case 'length':
        return this.evaluateLengthTrigger(triggerConfig, messageContent);
      
      case 'metadata':
        return this.evaluateMetadataTrigger(triggerConfig, metadata);
      
      default:
        logger.warn({ triggerType }, 'Unknown trigger type');
        return false;
    }
  }

  /**
   * Execute an action when condition is met
   */
  private async executeAction(
    condition: WorkflowCondition,
    conversationId: string,
    messageContent: string,
    metadata: Record<string, any>
  ): Promise<ActionResult> {
    const { actionType, actionConfig } = condition;
    const startTime = Date.now();

    try {
      let actionData: Record<string, any> = {};

      switch (actionType) {
        case 'webhook':
          actionData = await this.executeWebhookAction(actionConfig, conversationId, messageContent, metadata);
          break;
        
        case 'email':
          actionData = await this.executeEmailAction(actionConfig, conversationId, messageContent, metadata);
          break;
        
        case 'tag':
          actionData = await this.executeTagAction(actionConfig, conversationId, messageContent, metadata);
          break;
        
        case 'escalate':
          actionData = await this.executeEscalateAction(actionConfig, conversationId, messageContent, metadata);
          break;
        
        case 'custom_response':
          actionData = await this.executeCustomResponseAction(actionConfig, conversationId, messageContent, metadata);
          break;
        
        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }

      const result: ActionResult = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conditionId: condition.id,
        actionType,
        success: true,
        executionTime: Date.now() - startTime,
        data: actionData,
        timestamp: new Date().toISOString()
      };

      logger.info({ 
        conditionId: condition.id, 
        actionType, 
        executionTime: result.executionTime 
      }, 'Action executed successfully');

      return result;
    } catch (error) {
      const result: ActionResult = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conditionId: condition.id,
        actionType,
        success: false,
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };

      logger.error({ error, conditionId: condition.id, actionType }, 'Action execution failed');
      return result;
    }
  }

  // Trigger evaluation methods
  private evaluateKeywordTrigger(config: any, message: string): boolean {
    const { keywords, caseSensitive = false, matchAll = false } = config;
    const content = caseSensitive ? message : message.toLowerCase();
    const keywordList = keywords.map((k: string) => caseSensitive ? k : k.toLowerCase());

    if (matchAll) {
      return keywordList.every((keyword: string) => content.includes(keyword));
    } else {
      return keywordList.some((keyword: string) => content.includes(keyword));
    }
  }

  private evaluateRegexTrigger(config: any, message: string): boolean {
    const { pattern, flags = 'i' } = config;
    try {
      const regex = new RegExp(pattern, flags);
      return regex.test(message);
    } catch (error) {
      logger.error({ error, pattern, flags }, 'Invalid regex pattern');
      return false;
    }
  }

  private evaluateSentimentTrigger(config: any, message: string): boolean {
    // Placeholder for sentiment analysis
    // In a real implementation, you'd use a sentiment analysis service
    const { sentiment, threshold = 0.5 } = config;
    // For now, return false - would integrate with sentiment analysis API
    logger.warn('Sentiment trigger not yet implemented');
    return false;
  }

  private evaluateIntentTrigger(config: any, message: string): boolean {
    // Placeholder for intent classification
    // In a real implementation, you'd use an NLU service
    const { intents } = config;
    // For now, return false - would integrate with intent classification API
    logger.warn('Intent trigger not yet implemented');
    return false;
  }

  private evaluateLengthTrigger(config: any, message: string): boolean {
    const { minLength, maxLength } = config;
    const length = message.length;
    
    if (minLength !== undefined && length < minLength) return false;
    if (maxLength !== undefined && length > maxLength) return false;
    
    return true;
  }

  private evaluateMetadataTrigger(config: any, metadata: Record<string, any>): boolean {
    const { key, value, operator = 'equals' } = config;
    const metadataValue = metadata[key];

    switch (operator) {
      case 'equals':
        return metadataValue === value;
      case 'not_equals':
        return metadataValue !== value;
      case 'contains':
        return String(metadataValue).includes(String(value));
      case 'exists':
        return key in metadata;
      case 'not_exists':
        return !(key in metadata);
      default:
        return false;
    }
  }

  // Action execution methods
  private async executeWebhookAction(
    config: any,
    conversationId: string,
    messageContent: string,
    metadata: Record<string, any>
  ): Promise<Record<string, any>> {
    const { url, method = 'POST', headers = {}, payload = {} } = config;
    
    const webhookPayload = {
      ...payload,
      conversationId,
      messageContent,
      metadata,
      timestamp: new Date().toISOString()
    };

    // In a real implementation, you'd make the HTTP request here
    logger.info({ url, method }, 'Webhook action would be executed');
    
    return {
      url,
      method,
      payload: webhookPayload,
      status: 'simulated'
    };
  }

  private async executeEmailAction(
    config: any,
    conversationId: string,
    messageContent: string,
    metadata: Record<string, any>
  ): Promise<Record<string, any>> {
    const { to, subject, template } = config;
    
    // In a real implementation, you'd send an email here
    logger.info({ to, subject }, 'Email action would be executed');
    
    return {
      to,
      subject,
      template,
      conversationId,
      status: 'simulated'
    };
  }

  private async executeTagAction(
    config: any,
    conversationId: string,
    messageContent: string,
    metadata: Record<string, any>
  ): Promise<Record<string, any>> {
    const { tags } = config;
    
    // Add tags to conversation in database
    await query(`
      UPDATE conversations 
      SET metadata = jsonb_set(
        COALESCE(metadata, '{}'), 
        '{tags}', 
        COALESCE(metadata->'tags', '[]') || $1::jsonb
      )
      WHERE id = $2
    `, [JSON.stringify(tags), conversationId]);
    
    return {
      tags,
      conversationId,
      status: 'completed'
    };
  }

  private async executeEscalateAction(
    config: any,
    conversationId: string,
    messageContent: string,
    metadata: Record<string, any>
  ): Promise<Record<string, any>> {
    const { priority, assignTo, reason } = config;
    
    // Update conversation status to escalated
    await query(`
      UPDATE conversations 
      SET 
        status = 'escalated',
        metadata = jsonb_set(
          COALESCE(metadata, '{}'), 
          '{escalation}', 
          $1::jsonb
        )
      WHERE id = $2
    `, [JSON.stringify({ priority, assignTo, reason, escalatedAt: new Date().toISOString() }), conversationId]);
    
    return {
      priority,
      assignTo,
      reason,
      conversationId,
      status: 'escalated'
    };
  }

  private async executeCustomResponseAction(
    config: any,
    conversationId: string,
    messageContent: string,
    metadata: Record<string, any>
  ): Promise<Record<string, any>> {
    const { responseTemplate, variables = {} } = config;
    
    // Template variable replacement
    let response = responseTemplate;
    Object.entries(variables).forEach(([key, value]) => {
      response = response.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });
    
    // Replace built-in variables
    response = response.replace(/{{messageContent}}/g, messageContent);
    response = response.replace(/{{conversationId}}/g, conversationId);
    response = response.replace(/{{timestamp}}/g, new Date().toISOString());
    
    return {
      response,
      template: responseTemplate,
      variables,
      conversationId,
      status: 'generated'
    };
  }
}

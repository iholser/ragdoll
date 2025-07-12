import {
  Controller,
  Post,
  Body,
  Sse,
  MessageEvent,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Observable, from, map } from 'rxjs';
import { ChatService } from './chat.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat response generated successfully',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request or processing error',
  })
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      const response = await this.chatService.processMessage({
        message: chatRequest.message,
        conversationId: chatRequest.conversationId,
      });

      return {
        id: response.id,
        content: response.content,
        role: response.role,
        timestamp: response.timestamp,
        conversationId: response.conversationId,
        sources: response.sources,
      };
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      throw new BadRequestException('Failed to process chat message');
    }
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Stream chat response' })
  streamChat(@Body() chatRequest: ChatRequestDto): Observable<MessageEvent> {
    return from(this.chatService.processMessage({
      message: chatRequest.message,
      conversationId: chatRequest.conversationId,
    })).pipe(
      map((response) => ({
        data: {
          id: response.id,
          content: response.content,
          role: response.role,
          timestamp: response.timestamp,
          conversationId: response.conversationId,
          sources: response.sources,
        },
      }))
    );
  }
}

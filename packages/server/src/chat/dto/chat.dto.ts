import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ description: 'The user message' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Optional conversation ID', required: false })
  @IsString()
  @IsOptional()
  conversationId?: string;
}

export class ChatResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  conversationId: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  sources: any[];
}

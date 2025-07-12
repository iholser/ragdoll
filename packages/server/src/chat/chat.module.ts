import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { VectorModule } from '../vector/vector.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [VectorModule, AIModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

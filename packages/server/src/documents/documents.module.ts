import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentProcessingService } from './document-processing.service';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [VectorModule],
  controllers: [DocumentsController],
  providers: [DocumentProcessingService],
  exports: [DocumentProcessingService],
})
export class DocumentsModule {}

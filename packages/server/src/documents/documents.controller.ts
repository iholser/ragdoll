import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { DocumentProcessingService } from './document-processing.service';
import { VectorService } from '../vector/vector.service';
import { DocumentUploadDto, DocumentUploadResponseDto } from './dto/document-upload.dto';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly vectorService: VectorService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload and process a document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document uploaded and processed successfully',
    type: DocumentUploadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or processing error',
  })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported file type. Only PDF, DOCX, and TXT files are allowed.');
    }

    try {
      // Process the document
      const processedDoc = await this.documentProcessingService.processFile(
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      // Store chunks in vector database with real embeddings
      for (const chunk of processedDoc.chunks) {
        chunk.embedding = await this.vectorService.generateEmbedding(chunk.content);
        await this.vectorService.storeChunk(chunk);
      }

      return {
        id: processedDoc.id,
        filename: processedDoc.filename,
        fileType: processedDoc.fileType,
        totalChunks: processedDoc.chunks.length,
        message: 'Document uploaded and processed successfully',
      };
    } catch (error) {
      console.error('Error processing document:', error);
      throw new BadRequestException('Failed to process document');
    }
  }
}

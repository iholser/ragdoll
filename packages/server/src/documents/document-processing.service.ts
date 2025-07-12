import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import { DocumentChunk, ProcessedDocument } from '../common/types';

@Injectable()
export class DocumentProcessingService {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(private configService: ConfigService) {
    this.chunkSize = parseInt(this.configService.get<string>('CHUNK_SIZE', '1000'));
    this.chunkOverlap = parseInt(this.configService.get<string>('CHUNK_OVERLAP', '200'));
  }

  async processFile(buffer: Buffer, filename: string, mimetype: string): Promise<ProcessedDocument> {
    try {
      let text: string;
      let fileType: string;

      // Extract text based on file type
      if (mimetype === 'application/pdf') {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
        fileType = 'pdf';
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const docxData = await mammoth.extractRawText({ buffer });
        text = docxData.value;
        fileType = 'docx';
      } else if (mimetype === 'text/plain') {
        text = buffer.toString('utf-8');
        fileType = 'txt';
      } else {
        throw new Error(`Unsupported file type: ${mimetype}`);
      }

      // Clean and normalize text
      text = this.cleanText(text);

      // Split into chunks
      const chunks = this.createChunks(text, filename, fileType);

      const processedDoc: ProcessedDocument = {
        id: uuidv4(),
        filename,
        fileType,
        chunks,
        createdAt: new Date(),
      };

      return processedDoc;
    } catch (error) {
      console.error('Error processing file:', error);
      throw new Error(`Failed to process file: ${filename}`);
    }
  }

  private cleanText(text: string): string {
    // Remove excessive whitespace and normalize
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private createChunks(text: string, filename: string, fileType: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const words = text.split(' ');
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testChunk = currentChunk + ' ' + word;
      
      if (testChunk.length >= this.chunkSize) {
        // Create chunk
        if (currentChunk.trim()) {
          chunks.push({
            id: uuidv4(),
            content: currentChunk.trim(),
            metadata: {
              filename,
              fileType,
              chunkIndex,
              totalChunks: 0, // Will be updated later
              createdAt: new Date(),
            },
          });
          chunkIndex++;
        }
        
        // Start new chunk with overlap
        const overlapWords = this.getOverlapWords(currentChunk, this.chunkOverlap);
        currentChunk = overlapWords + ' ' + word;
      } else {
        currentChunk = testChunk;
      }
    }
    
    // Add final chunk if there's content
    if (currentChunk.trim()) {
      chunks.push({
        id: uuidv4(),
        content: currentChunk.trim(),
        metadata: {
          filename,
          fileType,
          chunkIndex,
          totalChunks: 0, // Will be updated below
          createdAt: new Date(),
        },
      });
    }
    
    // Update total chunks count
    const totalChunks = chunks.length;
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = totalChunks;
    });
    
    return chunks;
  }

  private getOverlapWords(text: string, overlapSize: number): string {
    const words = text.split(' ');
    const overlapWordCount = Math.floor(overlapSize / 5); // Approximate words for overlap
    return words.slice(-overlapWordCount).join(' ');
  }
}

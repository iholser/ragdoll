import { Test, TestingModule } from '@nestjs/testing';
import { DocumentProcessingService } from './document-processing.service';
import { ConfigService } from '@nestjs/config';

describe('DocumentProcessingService', () => {
  let service: DocumentProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentProcessingService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: any) => {
              const config = {
                CHUNK_SIZE: '1000',
                CHUNK_OVERLAP: '200',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DocumentProcessingService>(DocumentProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process text file', async () => {
    const buffer = Buffer.from('This is a test document with some content.');
    const result = await service.processFile(buffer, 'test.txt', 'text/plain');

    expect(result).toBeDefined();
    expect(result.filename).toBe('test.txt');
    expect(result.fileType).toBe('txt');
    expect(result.chunks).toHaveLength(1);
    expect(result.chunks[0].content).toBe('This is a test document with some content.');
  });

  it('should throw error for unsupported file type', async () => {
    const buffer = Buffer.from('test');
    
    await expect(
      service.processFile(buffer, 'test.unknown', 'application/unknown')
    ).rejects.toThrow('Unsupported file type');
  });
});

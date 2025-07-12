import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DocumentUploadDto {
  @ApiProperty({ 
    description: 'The uploaded file',
    type: 'string',
    format: 'binary'
  })
  file: Express.Multer.File;
}

export class DocumentUploadResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  totalChunks: number;

  @ApiProperty()
  message: string;
}

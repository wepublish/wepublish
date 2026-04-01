import { Module } from '@nestjs/common';
import { DocumentResolver } from './document.resolver';
import { PrismaModule } from '@wepublish/nest-modules';
import { DocumentService } from './document.service';
import { DocumentUploadService } from './document-upload.service';

@Module({
  imports: [PrismaModule],
  providers: [DocumentResolver, DocumentService, DocumentUploadService],
  exports: [DocumentUploadService],
})
export class DocumentModule {}

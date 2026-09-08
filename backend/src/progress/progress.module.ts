import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { UserModule } from '../user/user.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [UserModule, CatalogModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}

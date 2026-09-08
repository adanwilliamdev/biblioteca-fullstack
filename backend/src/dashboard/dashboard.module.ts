import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UserModule } from '../user/user.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [UserModule, CatalogModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

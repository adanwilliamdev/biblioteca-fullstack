import { Module } from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { TmdbController } from './tmdb.controller';

@Module({
  controllers: [TmdbController],
  providers: [TmdbService],
})
export class TmdbModule {}

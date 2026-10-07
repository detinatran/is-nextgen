import { Module } from '@nestjs/common';
import { FixturesController } from './fixtures.controller';
import { FixturesGuard } from './fixtures.guard';
import { IdentityAccessModule } from '../identity-access/identity-access.module';
import { ExamOperationsModule } from '../exam-operations/exam-operations.module';

@Module({
  imports: [IdentityAccessModule, ExamOperationsModule],
  controllers: [FixturesController],
  providers: [FixturesGuard],
})
export class FixturesModule {}

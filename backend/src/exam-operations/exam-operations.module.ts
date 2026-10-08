import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { ExamAccessService } from './exam-access.service';
import { IdentityAccessModule } from '../identity-access/identity-access.module';

@Module({
  imports: [IdentityAccessModule],
  controllers: [AssignmentsController],
  providers: [ExamAccessService],
  exports: [ExamAccessService],
})
export class ExamOperationsModule {}

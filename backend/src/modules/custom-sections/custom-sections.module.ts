import { Module } from '@nestjs/common';
import { CustomSectionsService } from './custom-sections.service';
import { CustomSectionsController } from './custom-sections.controller';
import { CustomSectionsRepository } from './repository/custom-sections.repository';

@Module({
  controllers: [CustomSectionsController],
  providers: [CustomSectionsService, CustomSectionsRepository],
  exports: [CustomSectionsService],
})
export class CustomSectionsModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { StatusModule } from './modules/status/status.module';
import { RolesModule } from './modules/roles/roles.module';
import { CategoryModule } from './modules/category/category.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EducationModule } from './modules/education/education.module';
import { TechnologiesModule } from './modules/technologies/technologies.module';
import { ImagesModule } from './modules/images/images.module';
import { UploadModule } from './modules/uploads/uploads.module';
import { ExperienceModule } from './modules/experience/experience.module';
import { PublicModule } from './modules/public/public.module';
import { AuditModule } from './modules/audit/audit.module';
import { CustomSectionsModule } from './modules/custom-sections/custom-sections.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UsersModule,
    StatusModule,
    RolesModule,
    CategoryModule,
    AuthModule,
    ProjectsModule,
    CoursesModule,
    EducationModule,
    TechnologiesModule,
    ImagesModule,
    UploadModule,
    ExperienceModule,
    PublicModule,
    AuditModule,
    CustomSectionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}

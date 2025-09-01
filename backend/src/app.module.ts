import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { StatusModule } from './modules/status/status.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuthMethodModule } from './modules/auth_method/auth_method.module';
import { CategoryModule } from './modules/category/category.module';
import { PrismaService } from './database/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EducationModule } from './modules/education/education.module';
import { TechnologiesModule } from './modules/technologies/technologies.module';
import { ImagesModule } from './modules/images/images.module';
import { UploadModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    UsersModule,
    StatusModule,
    RolesModule,
    AuthMethodModule,
    CategoryModule,
    AuthModule,
    ProjectsModule,
    CoursesModule,
    EducationModule,
    TechnologiesModule,
    ImagesModule,
    UploadModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}

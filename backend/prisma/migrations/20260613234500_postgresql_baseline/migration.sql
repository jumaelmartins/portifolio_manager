-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."d_category" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."d_status" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."d_roles" (
    "id" SERIAL NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."d_auth_method" (
    "id" SERIAL NOT NULL,
    "method" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_auth_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."d_technologies" (
    "id" SERIAL NOT NULL,
    "tech" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_technologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL DEFAULT 2,
    "status_id" INTEGER NOT NULL DEFAULT 1,
    "auth_method_id" INTEGER NOT NULL DEFAULT 1,
    "f_profile_pictureId" INTEGER,
    "last_login" TIMESTAMP(3),
    "online" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "verified_email" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_verification_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."f_images" (
    "id" SERIAL NOT NULL,
    "description" TEXT,
    "src_path" TEXT NOT NULL,
    "f_userId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "f_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."f_profile_picture" (
    "id" SERIAL NOT NULL,
    "f_userId" INTEGER NOT NULL,
    "f_imagesId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "f_profile_picture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."f_experience" (
    "id" SERIAL NOT NULL,
    "tile" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "current" BOOLEAN NOT NULL DEFAULT false,
    "f_userId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "f_experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."f_education" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "current" BOOLEAN NOT NULL DEFAULT false,
    "f_userId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "f_education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."f_courses" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "current" BOOLEAN NOT NULL DEFAULT false,
    "f_userId" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "f_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."f_projects" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "repo_url" TEXT,
    "live_url" TEXT,
    "f_userId" INTEGER NOT NULL,
    "d_categoryId" INTEGER NOT NULL,
    "f_imagesId" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "f_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custom_sections" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "field_schema" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custom_section_items" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "section_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_section_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_d_technologiesTof_projects" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_d_technologiesTof_projects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "d_category_category_key" ON "public"."d_category"("category");

-- CreateIndex
CREATE UNIQUE INDEX "d_status_status_key" ON "public"."d_status"("status");

-- CreateIndex
CREATE UNIQUE INDEX "d_roles_role_key" ON "public"."d_roles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "d_auth_method_method_key" ON "public"."d_auth_method"("method");

-- CreateIndex
CREATE UNIQUE INDEX "d_technologies_tech_key" ON "public"."d_technologies"("tech");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "public"."email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_user_id_created_at_idx" ON "public"."email_verification_tokens"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "f_profile_picture_f_userId_key" ON "public"."f_profile_picture"("f_userId");

-- CreateIndex
CREATE UNIQUE INDEX "f_profile_picture_f_imagesId_key" ON "public"."f_profile_picture"("f_imagesId");

-- CreateIndex
CREATE UNIQUE INDEX "f_projects_title_key" ON "public"."f_projects"("title");

-- CreateIndex
CREATE INDEX "_d_technologiesTof_projects_B_index" ON "public"."_d_technologiesTof_projects"("B");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."d_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."d_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_auth_method_id_fkey" FOREIGN KEY ("auth_method_id") REFERENCES "public"."d_auth_method"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."f_images" ADD CONSTRAINT "f_images_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."f_profile_picture" ADD CONSTRAINT "f_profile_picture_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."f_profile_picture" ADD CONSTRAINT "f_profile_picture_f_imagesId_fkey" FOREIGN KEY ("f_imagesId") REFERENCES "public"."f_images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."f_experience" ADD CONSTRAINT "f_experience_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."f_education" ADD CONSTRAINT "f_education_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."f_courses" ADD CONSTRAINT "f_courses_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."f_projects" ADD CONSTRAINT "f_projects_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."f_projects" ADD CONSTRAINT "f_projects_d_categoryId_fkey" FOREIGN KEY ("d_categoryId") REFERENCES "public"."d_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."f_projects" ADD CONSTRAINT "f_projects_f_imagesId_fkey" FOREIGN KEY ("f_imagesId") REFERENCES "public"."f_images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_sections" ADD CONSTRAINT "custom_sections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_section_items" ADD CONSTRAINT "custom_section_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."custom_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_d_technologiesTof_projects" ADD CONSTRAINT "_d_technologiesTof_projects_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."d_technologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_d_technologiesTof_projects" ADD CONSTRAINT "_d_technologiesTof_projects_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."f_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

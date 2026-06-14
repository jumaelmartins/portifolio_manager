-- CreateTable
CREATE TABLE "d_category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "d_status" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "d_roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "d_auth_method" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "method" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "d_technologies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tech" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "f_user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,
    "auth_method_id" INTEGER NOT NULL,
    "f_profile_pictureId" INTEGER NOT NULL,
    CONSTRAINT "f_user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "d_roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "f_user_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "d_status" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "f_user_auth_method_id_fkey" FOREIGN KEY ("auth_method_id") REFERENCES "d_auth_method" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "f_images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT,
    "src_path" TEXT NOT NULL,
    "f_userId" INTEGER NOT NULL,
    CONSTRAINT "f_images_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "f_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "f_profile_picture" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "f_userId" INTEGER NOT NULL,
    "f_imagesId" INTEGER NOT NULL,
    CONSTRAINT "f_profile_picture_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "f_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "f_profile_picture_f_imagesId_fkey" FOREIGN KEY ("f_imagesId") REFERENCES "f_images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "f_experience" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tile" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "f_userId" INTEGER NOT NULL,
    CONSTRAINT "f_experience_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "f_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "f_education" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tile" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "f_userId" INTEGER NOT NULL,
    CONSTRAINT "f_education_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "f_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "f_courses" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tile" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "f_userId" INTEGER NOT NULL,
    CONSTRAINT "f_courses_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "f_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "f_projects" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tile" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "repo_url" TEXT,
    "live_url" TEXT,
    "d_categoryId" INTEGER NOT NULL,
    "f_imagesId" INTEGER NOT NULL,
    "f_userId" INTEGER NOT NULL,
    CONSTRAINT "f_projects_f_userId_fkey" FOREIGN KEY ("f_userId") REFERENCES "f_user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "f_projects_f_imagesId_fkey" FOREIGN KEY ("f_imagesId") REFERENCES "f_images" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "f_projects_d_categoryId_fkey" FOREIGN KEY ("d_categoryId") REFERENCES "d_category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_d_technologiesTof_user" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_d_technologiesTof_user_A_fkey" FOREIGN KEY ("A") REFERENCES "d_technologies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_d_technologiesTof_user_B_fkey" FOREIGN KEY ("B") REFERENCES "f_user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_d_technologiesTof_projects" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_d_technologiesTof_projects_A_fkey" FOREIGN KEY ("A") REFERENCES "d_technologies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_d_technologiesTof_projects_B_fkey" FOREIGN KEY ("B") REFERENCES "f_projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "f_user_email_key" ON "f_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "f_profile_picture_f_userId_key" ON "f_profile_picture"("f_userId");

-- CreateIndex
CREATE UNIQUE INDEX "f_profile_picture_f_imagesId_key" ON "f_profile_picture"("f_imagesId");

-- CreateIndex
CREATE UNIQUE INDEX "_d_technologiesTof_user_AB_unique" ON "_d_technologiesTof_user"("A", "B");

-- CreateIndex
CREATE INDEX "_d_technologiesTof_user_B_index" ON "_d_technologiesTof_user"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_d_technologiesTof_projects_AB_unique" ON "_d_technologiesTof_projects"("A", "B");

-- CreateIndex
CREATE INDEX "_d_technologiesTof_projects_B_index" ON "_d_technologiesTof_projects"("B");

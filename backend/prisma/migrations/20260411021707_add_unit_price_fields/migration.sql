/*
  Warnings:

  - You are about to drop the column `userId` on the `UserList` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `UserList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Price" ADD COLUMN     "unit_price" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "unit_type" TEXT,
ADD COLUMN     "unit_value" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "UserList" DROP COLUMN "userId",
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScraperLog" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "items_scraped" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScraperLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

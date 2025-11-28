/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ContactFormMessage` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `ContactFormMessage` table. All the data in the column will be lost.
  - You are about to drop the column `repliedAt` on the `ContactFormMessage` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `ContactFormMessage` table. All the data in the column will be lost.
  - You are about to drop the column `paidUserCount` on the `DailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `paidUserDelta` on the `DailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `prevDayViewsChangePercent` on the `DailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `totalProfit` on the `DailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `totalRevenue` on the `DailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `totalViews` on the `DailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `userCount` on the `DailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `userDelta` on the `DailyStats` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `uploadUrl` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `GptResponse` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `GptResponse` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `GptResponse` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Logs` table. All the data in the column will be lost.
  - You are about to drop the column `dailyStatsId` on the `PageViewSource` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `isDone` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `datePaid` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lemon_squeezy_customer_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[verification_token]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reset_token]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `ContactFormMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `upload_url` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `GptResponse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `GptResponse` table without a default value. This is not possible if the table is not empty.
  - Added the required column `daily_stats_id` to the `PageViewSource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COMMUNITY_STAFF', 'FUNDER', 'PUBLIC_VIEWER');

-- CreateEnum
CREATE TYPE "Province" AS ENUM ('AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'COMPLETED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CertificationLevel" AS ENUM ('SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- CreateEnum
CREATE TYPE "IndicatorCategory" AS ENUM ('GOVERNANCE', 'CAPACITY', 'PLANNING', 'INFRASTRUCTURE', 'OPERATIONS', 'BUILDINGS', 'TRANSPORTATION', 'WASTE', 'ENERGY', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ImplementationStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectSector" AS ENUM ('BUILDINGS', 'TRANSPORTATION', 'WASTE_MANAGEMENT', 'RENEWABLE_ENERGY', 'ENERGY_EFFICIENCY', 'LAND_USE', 'WATER', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'IN_DESIGN', 'FUNDED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FunderType" AS ENUM ('FEDERAL', 'PROVINCIAL', 'MUNICIPAL', 'FOUNDATION', 'CORPORATE', 'UTILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "FundingStatus" AS ENUM ('PENDING', 'APPROVED', 'RECEIVED', 'DENIED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "ContactFormMessage" DROP CONSTRAINT "ContactFormMessage_userId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_userId_fkey";

-- DropForeignKey
ALTER TABLE "GptResponse" DROP CONSTRAINT "GptResponse_userId_fkey";

-- DropForeignKey
ALTER TABLE "PageViewSource" DROP CONSTRAINT "PageViewSource_dailyStatsId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- AlterTable
ALTER TABLE "ContactFormMessage" DROP COLUMN "createdAt",
DROP COLUMN "isRead",
DROP COLUMN "repliedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replied_at" TIMESTAMP(3),
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DailyStats" DROP COLUMN "paidUserCount",
DROP COLUMN "paidUserDelta",
DROP COLUMN "prevDayViewsChangePercent",
DROP COLUMN "totalProfit",
DROP COLUMN "totalRevenue",
DROP COLUMN "totalViews",
DROP COLUMN "userCount",
DROP COLUMN "userDelta",
ADD COLUMN     "paid_user_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paid_user_delta" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "prev_day_views_change_percent" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "total_profit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "user_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "user_delta" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "File" DROP COLUMN "createdAt",
DROP COLUMN "uploadUrl",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "upload_url" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GptResponse" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Logs" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PageViewSource" DROP COLUMN "dailyStatsId",
ADD COLUMN     "daily_stats_id" INTEGER NOT NULL,
ALTER COLUMN "date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "createdAt",
DROP COLUMN "isDone",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_done" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "datePaid",
ADD COLUMN     "checkout_session_id" TEXT,
ADD COLUMN     "community_id" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date_paid" TIMESTAMP(3),
ADD COLUMN     "email_verification_sent_at" TIMESTAMP(3),
ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_active_timestamp" TIMESTAMP(3),
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "lemon_squeezy_customer_id" TEXT,
ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "password_reset_sent_at" TIMESTAMP(3),
ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expiry" TIMESTAMP(3),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'COMMUNITY_STAFF',
ADD COLUMN     "stripe_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "verification_token" TEXT,
ALTER COLUMN "credits" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "province" "Province" NOT NULL,
    "region" TEXT,
    "population" INTEGER,
    "land_area_km2" DOUBLE PRECISION,
    "baseline_emissions_tco2e" DOUBLE PRECISION,
    "baseline_year" INTEGER,
    "primary_contact_name" TEXT,
    "primary_contact_email" TEXT,
    "primary_contact_phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "assessment_date" TIMESTAMP(3) NOT NULL,
    "assessment_year" INTEGER NOT NULL,
    "assessor_name" TEXT NOT NULL,
    "assessor_organization" TEXT NOT NULL,
    "assessor_email" TEXT,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "overall_score" DOUBLE PRECISION,
    "max_possible_score" DOUBLE PRECISION DEFAULT 100,
    "certification_level" "CertificationLevel",
    "general_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicator_scores" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "indicator_number" INTEGER NOT NULL,
    "indicator_name" TEXT NOT NULL,
    "category" "IndicatorCategory" NOT NULL,
    "points_earned" DOUBLE PRECISION NOT NULL,
    "points_possible" DOUBLE PRECISION NOT NULL,
    "percentage_score" DOUBLE PRECISION,
    "notes" TEXT,
    "evidence_files" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "indicator_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strengths" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "category" "IndicatorCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "strengths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "indicator_number" INTEGER,
    "recommendation_text" TEXT NOT NULL,
    "priority_level" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "responsible_party" TEXT,
    "implementation_status" "ImplementationStatus" NOT NULL DEFAULT 'PLANNED',
    "target_date" TIMESTAMP(3),
    "completion_date" TIMESTAMP(3),
    "estimated_cost" DOUBLE PRECISION,
    "estimated_ghg_reduction" DOUBLE PRECISION,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "project_code" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "description" TEXT,
    "project_type" TEXT NOT NULL,
    "sector" "ProjectSector" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
    "priority_level" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "estimated_ghg_reduction" DOUBLE PRECISION,
    "estimated_energy_reduction" DOUBLE PRECISION,
    "estimated_cost" DOUBLE PRECISION,
    "planned_start_date" TIMESTAMP(3),
    "actual_start_date" TIMESTAMP(3),
    "estimated_completion_date" TIMESTAMP(3),
    "actual_completion_date" TIMESTAMP(3),
    "completion_percentage" INTEGER NOT NULL DEFAULT 0,
    "total_budget" DOUBLE PRECISION,
    "total_secured_funding" DOUBLE PRECISION,
    "funding_gap" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "funder_name" TEXT NOT NULL,
    "funder_type" "FunderType" NOT NULL,
    "grant_program" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "FundingStatus" NOT NULL DEFAULT 'PENDING',
    "application_date" TIMESTAMP(3),
    "approval_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "notes" TEXT,
    "agreement_file" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "funding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "milestone_name" TEXT NOT NULL,
    "description" TEXT,
    "target_date" TIMESTAMP(3) NOT NULL,
    "actual_date" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "display_order" INTEGER NOT NULL,
    "depends_on_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "completion_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_extraction_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_path" TEXT,
    "status" "ExtractionStatus" NOT NULL,
    "extracted_data" JSONB,
    "confidence_scores" JSONB,
    "error_message" TEXT,
    "error_stack" TEXT,
    "inserted_record_ids" JSONB,
    "processing_time_ms" INTEGER,
    "tokens_used" INTEGER,
    "cost_usd" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ai_extraction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RecommendationToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "communities_name_key" ON "communities"("name");

-- CreateIndex
CREATE INDEX "communities_province_idx" ON "communities"("province");

-- CreateIndex
CREATE INDEX "communities_is_active_idx" ON "communities"("is_active");

-- CreateIndex
CREATE INDEX "assessments_community_id_idx" ON "assessments"("community_id");

-- CreateIndex
CREATE INDEX "assessments_assessment_year_idx" ON "assessments"("assessment_year");

-- CreateIndex
CREATE INDEX "assessments_status_idx" ON "assessments"("status");

-- CreateIndex
CREATE INDEX "assessments_created_by_idx" ON "assessments"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_community_id_assessment_year_key" ON "assessments"("community_id", "assessment_year");

-- CreateIndex
CREATE INDEX "indicator_scores_assessment_id_idx" ON "indicator_scores"("assessment_id");

-- CreateIndex
CREATE INDEX "indicator_scores_indicator_number_idx" ON "indicator_scores"("indicator_number");

-- CreateIndex
CREATE UNIQUE INDEX "indicator_scores_assessment_id_indicator_number_key" ON "indicator_scores"("assessment_id", "indicator_number");

-- CreateIndex
CREATE INDEX "strengths_assessment_id_idx" ON "strengths"("assessment_id");

-- CreateIndex
CREATE INDEX "recommendations_assessment_id_idx" ON "recommendations"("assessment_id");

-- CreateIndex
CREATE INDEX "recommendations_priority_level_idx" ON "recommendations"("priority_level");

-- CreateIndex
CREATE INDEX "recommendations_implementation_status_idx" ON "recommendations"("implementation_status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_code_key" ON "projects"("project_code");

-- CreateIndex
CREATE INDEX "projects_community_id_idx" ON "projects"("community_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_sector_idx" ON "projects"("sector");

-- CreateIndex
CREATE INDEX "projects_priority_level_idx" ON "projects"("priority_level");

-- CreateIndex
CREATE INDEX "projects_created_by_idx" ON "projects"("created_by");

-- CreateIndex
CREATE INDEX "funding_project_id_idx" ON "funding"("project_id");

-- CreateIndex
CREATE INDEX "funding_funder_type_idx" ON "funding"("funder_type");

-- CreateIndex
CREATE INDEX "funding_status_idx" ON "funding"("status");

-- CreateIndex
CREATE INDEX "milestones_project_id_idx" ON "milestones"("project_id");

-- CreateIndex
CREATE INDEX "milestones_status_idx" ON "milestones"("status");

-- CreateIndex
CREATE INDEX "milestones_target_date_idx" ON "milestones"("target_date");

-- CreateIndex
CREATE INDEX "ai_extraction_logs_user_id_idx" ON "ai_extraction_logs"("user_id");

-- CreateIndex
CREATE INDEX "ai_extraction_logs_status_idx" ON "ai_extraction_logs"("status");

-- CreateIndex
CREATE INDEX "ai_extraction_logs_document_type_idx" ON "ai_extraction_logs"("document_type");

-- CreateIndex
CREATE INDEX "ai_extraction_logs_created_at_idx" ON "ai_extraction_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "_RecommendationToProject_AB_unique" ON "_RecommendationToProject"("A", "B");

-- CreateIndex
CREATE INDEX "_RecommendationToProject_B_index" ON "_RecommendationToProject"("B");

-- CreateIndex
CREATE INDEX "ContactFormMessage_user_id_idx" ON "ContactFormMessage"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "File_key_key" ON "File"("key");

-- CreateIndex
CREATE INDEX "File_user_id_idx" ON "File"("user_id");

-- CreateIndex
CREATE INDEX "GptResponse_user_id_idx" ON "GptResponse"("user_id");

-- CreateIndex
CREATE INDEX "Task_user_id_idx" ON "Task"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripe_id_key" ON "User"("stripe_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_lemon_squeezy_customer_id_key" ON "User"("lemon_squeezy_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_verification_token_key" ON "User"("verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "User_reset_token_key" ON "User"("reset_token");

-- CreateIndex
CREATE INDEX "User_community_id_idx" ON "User"("community_id");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_subscriptionStatus_idx" ON "User"("subscriptionStatus");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GptResponse" ADD CONSTRAINT "GptResponse_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageViewSource" ADD CONSTRAINT "PageViewSource_daily_stats_id_fkey" FOREIGN KEY ("daily_stats_id") REFERENCES "DailyStats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactFormMessage" ADD CONSTRAINT "ContactFormMessage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicator_scores" ADD CONSTRAINT "indicator_scores_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "strengths" ADD CONSTRAINT "strengths_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "funding" ADD CONSTRAINT "funding_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_extraction_logs" ADD CONSTRAINT "ai_extraction_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecommendationToProject" ADD CONSTRAINT "_RecommendationToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecommendationToProject" ADD CONSTRAINT "_RecommendationToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

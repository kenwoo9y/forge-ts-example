-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "public_id" UUID NOT NULL DEFAULT gen_random_uuid();

/*
  Warnings:

  - Made the column `title` on table `tasks` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `tasks` required. This step will fail if there are existing NULL values in that column.
  - Made the column `owner_id` on table `tasks` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_owner_id_fkey";

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'todo',
ALTER COLUMN "owner_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

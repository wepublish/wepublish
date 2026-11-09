-- AlterEnum
ALTER TYPE "PdfRendererType" ADD VALUE 'gotenberg';

-- AlterTable
ALTER TABLE "settings.pdfrenderer" ADD COLUMN     "gotenberg_password" TEXT,
ADD COLUMN     "gotenberg_url" TEXT,
ADD COLUMN     "gotenberg_username" TEXT;

-- CreateTable
CREATE TABLE "assets" (
    "id" SERIAL NOT NULL,
    "assetId" TEXT NOT NULL,
    "name" TEXT,
    "shortDescription" TEXT,
    "tags" JSONB,
    "previewImageUrls" JSONB,
    "license" TEXT,
    "objectType" TEXT,
    "animationsCount" INTEGER,
    "maxFramesCount" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "dominantColors" JSONB,
    "createAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packs" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "tag" TEXT,
    "categories" JSONB,
    "thumbnailUrl" TEXT,
    "assetsCount" INTEGER,
    "authors" JSONB,
    "licenses" JSONB,
    "createAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "prop" SMALLINT DEFAULT 0,
    "createAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tagsTree" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "children" JSONB,
    "allChildrenTags" JSONB,
    "createAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tagsTree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "searchToken" TEXT,
    "website" TEXT,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "website" TEXT,
    "searchToken" TEXT,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "wallet" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" SERIAL NOT NULL,
    "tx" TEXT NOT NULL,
    "credit" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_key" ON "User"("wallet");

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

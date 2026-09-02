-- CreateTable
CREATE TABLE "saved_charts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "spec" JSONB NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "saved_charts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_charts_user_id_pinned_updated_at_idx" ON "saved_charts"("user_id", "pinned" DESC, "updated_at" DESC);

-- AddForeignKey
ALTER TABLE "saved_charts" ADD CONSTRAINT "saved_charts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

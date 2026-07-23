-- CreateEnum
CREATE TYPE "treatment_style" AS ENUM ('formal', 'informal', 'very_informal');

-- CreateEnum
CREATE TYPE "credential_type" AS ENUM ('password');

-- CreateEnum
CREATE TYPE "oauth_provider" AS ENUM ('google');

-- CreateEnum
CREATE TYPE "auth_audit_event" AS ENUM ('login_success', 'login_failure', 'passkey_enrolled', 'oauth_linked', 'password_changed', 'all_sessions_revoked');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('expense', 'income');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('open', 'closed', 'paid', 'overdue');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "nickname" VARCHAR(50),
    "onboarded_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistant_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "treatment_style" "treatment_style" NOT NULL DEFAULT 'informal',
    "voice_id" VARCHAR(255) NOT NULL,
    "avatar_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assistant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "credential_type" NOT NULL,
    "hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip" INET,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "oauth_provider" NOT NULL,
    "provider_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_audit_log" (
    "id" UUID NOT NULL,
    "event" "auth_audit_event" NOT NULL,
    "user_id" UUID,
    "ip" INET,
    "user_agent" TEXT,
    "context" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passkey_credentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "credential_id" TEXT NOT NULL,
    "public_key" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT[],
    "device_type" TEXT,
    "backed_up" BOOLEAN,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ,

    CONSTRAINT "passkey_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banks" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "compe_code" VARCHAR(10) NOT NULL,
    "logo_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bank_accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "bank_id" UUID NOT NULL,
    "nickname" VARCHAR(80) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit_limit" DECIMAL(15,2),
    "overdraft_limit" DECIMAL(15,2),
    "close_day" SMALLINT,
    "due_day" SMALLINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "name" VARCHAR(80) NOT NULL,
    "icon" VARCHAR(50),
    "color" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "category_id" UUID,
    "invoice_id" UUID,
    "installment_group_id" UUID,
    "installment_number" SMALLINT,
    "type" "transaction_type" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" VARCHAR(255),
    "occurred_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "from_account_id" UUID NOT NULL,
    "to_account_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "description" VARCHAR(255),
    "occurred_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_card_invoices" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "status" "invoice_status" NOT NULL DEFAULT 'open',
    "cycle_start" DATE NOT NULL,
    "cycle_end" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "closed_at" TIMESTAMPTZ,
    "paid_at" TIMESTAMPTZ,
    "paid_via_transfer_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "credit_card_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installment_groups" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "category_id" UUID,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "installments_count" SMALLINT NOT NULL,
    "installment_amount" DECIMAL(15,2) NOT NULL,
    "description" VARCHAR(255),
    "purchase_date" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "installment_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "assistant_profiles_user_id_key" ON "assistant_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_user_id_type_key" ON "credentials"("user_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_id_key" ON "oauth_accounts"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "auth_audit_log_user_id_idx" ON "auth_audit_log"("user_id");

-- CreateIndex
CREATE INDEX "auth_audit_log_event_idx" ON "auth_audit_log"("event");

-- CreateIndex
CREATE INDEX "auth_audit_log_created_at_idx" ON "auth_audit_log"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "passkey_credentials_credential_id_key" ON "passkey_credentials"("credential_id");

-- CreateIndex
CREATE INDEX "passkey_credentials_user_id_idx" ON "passkey_credentials"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "banks_compe_code_key" ON "banks"("compe_code");

-- CreateIndex
CREATE INDEX "user_bank_accounts_user_id_idx" ON "user_bank_accounts"("user_id");

-- CreateIndex
CREATE INDEX "user_bank_accounts_bank_id_idx" ON "user_bank_accounts"("bank_id");

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "categories"("user_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_occurred_at_idx" ON "transactions"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "transactions_account_id_idx" ON "transactions"("account_id");

-- CreateIndex
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");

-- CreateIndex
CREATE INDEX "transactions_invoice_id_idx" ON "transactions"("invoice_id");

-- CreateIndex
CREATE INDEX "transactions_installment_group_id_idx" ON "transactions"("installment_group_id");

-- CreateIndex
CREATE INDEX "transfers_user_id_occurred_at_idx" ON "transfers"("user_id", "occurred_at");

-- CreateIndex
CREATE INDEX "transfers_from_account_id_idx" ON "transfers"("from_account_id");

-- CreateIndex
CREATE INDEX "transfers_to_account_id_idx" ON "transfers"("to_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_invoices_paid_via_transfer_id_key" ON "credit_card_invoices"("paid_via_transfer_id");

-- CreateIndex
CREATE INDEX "credit_card_invoices_account_id_status_idx" ON "credit_card_invoices"("account_id", "status");

-- CreateIndex
CREATE INDEX "credit_card_invoices_status_idx" ON "credit_card_invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "credit_card_invoices_account_id_cycle_start_key" ON "credit_card_invoices"("account_id", "cycle_start");

-- CreateIndex
CREATE INDEX "installment_groups_user_id_idx" ON "installment_groups"("user_id");

-- CreateIndex
CREATE INDEX "installment_groups_account_id_idx" ON "installment_groups"("account_id");

-- AddForeignKey
ALTER TABLE "assistant_profiles" ADD CONSTRAINT "assistant_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_audit_log" ADD CONSTRAINT "auth_audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passkey_credentials" ADD CONSTRAINT "passkey_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bank_accounts" ADD CONSTRAINT "user_bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bank_accounts" ADD CONSTRAINT "user_bank_accounts_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "user_bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "credit_card_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_installment_group_id_fkey" FOREIGN KEY ("installment_group_id") REFERENCES "installment_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_account_id_fkey" FOREIGN KEY ("from_account_id") REFERENCES "user_bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_account_id_fkey" FOREIGN KEY ("to_account_id") REFERENCES "user_bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_invoices" ADD CONSTRAINT "credit_card_invoices_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "user_bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_card_invoices" ADD CONSTRAINT "credit_card_invoices_paid_via_transfer_id_fkey" FOREIGN KEY ("paid_via_transfer_id") REFERENCES "transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_groups" ADD CONSTRAINT "installment_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_groups" ADD CONSTRAINT "installment_groups_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "user_bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installment_groups" ADD CONSTRAINT "installment_groups_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

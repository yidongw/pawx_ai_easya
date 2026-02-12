CREATE TABLE IF NOT EXISTS "user_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_user_id" text NOT NULL,
	"evm_address" text NOT NULL,
	"sol_address" text NOT NULL,
	"evm_private_key" text NOT NULL,
	"sol_private_key" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_wallets_telegram_user_id_idx" UNIQUE ("telegram_user_id")
);

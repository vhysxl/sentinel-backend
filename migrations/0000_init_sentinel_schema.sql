CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"fullname" varchar(100) NOT NULL,
	"password_hash" varchar(255),
	"google_sub" varchar(255),
	"is_admin" boolean DEFAULT false NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_sub_unique" UNIQUE("google_sub")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_name" varchar(100) NOT NULL,
	"bank_account" varchar(50) NOT NULL,
	"join_date" timestamp DEFAULT now(),
	"status" varchar(20) DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"type" varchar(10) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"vendor_id" integer,
	"input_by_user_id" integer
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_input_by_user_id_users_id_fk" FOREIGN KEY ("input_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
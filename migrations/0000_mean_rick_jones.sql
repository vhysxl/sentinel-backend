CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"fullname" varchar(100),
	"password" varchar(255) NOT NULL,
	"role" varchar(20) NOT NULL,
	"department" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
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
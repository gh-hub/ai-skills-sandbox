CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_built_in" boolean NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
INSERT INTO "roles" ("name", "is_built_in") VALUES
	('ADMIN', true),
	('OPERATOR', true);
--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "role_id" uuid;--> statement-breakpoint
UPDATE "user_roles" SET "role_id" = "roles"."id" FROM "roles" WHERE "roles"."name" = "user_roles"."role"::text;--> statement-breakpoint
ALTER TABLE "user_roles" ALTER COLUMN "role_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_user_id_role_unique";--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_role_id_unique" UNIQUE("user_id","role_id");--> statement-breakpoint
ALTER TABLE "user_roles" DROP COLUMN "role";--> statement-breakpoint
DROP TYPE "public"."role";

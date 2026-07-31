CREATE TABLE "awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text
);
--> statement-breakpoint
CREATE TABLE "like_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"like_id" uuid NOT NULL,
	"award_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "like_awards" ADD CONSTRAINT "like_awards_like_id_likes_id_fk" FOREIGN KEY ("like_id") REFERENCES "public"."likes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "like_awards" ADD CONSTRAINT "like_awards_award_id_awards_id_fk" FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "awards" ("icon", "title", "description") VALUES
	('🐛', 'Bug Slayer', 'Squashed a nasty bug that had been haunting the codebase'),
	('⚡', 'Speed Demon', 'Shipped something impressively fast'),
	('🧠', 'Clean Code', 'Wrote code so clean it made someone smile'),
	('🛟', 'Lifesaver', 'Saved the day right before a deadline or outage'),
	('🎨', 'Creative Genius', 'Came up with a solution nobody else thought of'),
	('📚', 'Patient Teacher', 'Explained something clearly and patiently'),
	('🔧', 'Refactor Royalty', 'Turned a mess into something maintainable');
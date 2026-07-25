import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { DbModule } from "./db/db.module";
import { LikesModule } from "./apps/likes/likes.module";
import { AuthModule } from "./apps/auth/auth.module";

@Module({
  imports: [DbModule, LikesModule, AuthModule],
  controllers: [AppController],
})
export class AppModule {}

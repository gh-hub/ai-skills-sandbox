import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { DbModule } from "./db/db.module";
import { LikesModule } from "./likes/likes.module";

@Module({
  imports: [DbModule, LikesModule],
  controllers: [AppController],
})
export class AppModule {}

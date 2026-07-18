import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { LikesModule } from "./likes/likes.module";

@Module({
  imports: [LikesModule],
  controllers: [AppController],
})
export class AppModule {}

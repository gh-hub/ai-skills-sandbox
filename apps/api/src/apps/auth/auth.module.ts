import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import type { Env } from "../../config/env.schema";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CurrentUserGuard } from "./current-user.guard";
import { SESSION_EXPIRY } from "./session.constants";

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService<Env, true>) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: { expiresIn: SESSION_EXPIRY },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: CurrentUserGuard }],
  exports: [AuthService],
})
export class AuthModule {}

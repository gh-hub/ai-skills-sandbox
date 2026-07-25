import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { CurrentUserGuard } from "./current-user.guard";
import { JWT_SECRET } from "./jwt-secret";
import { SESSION_EXPIRY } from "./session.constants";

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: SESSION_EXPIRY },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: CurrentUserGuard }],
  exports: [AuthService],
})
export class AuthModule {}

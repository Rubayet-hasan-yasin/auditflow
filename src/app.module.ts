import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { HelperModule } from './helper/helper.module';
import { databaseConfig } from './helper/config';

@Module({
  imports: [
    HelperModule,
    TypeOrmModule.forRoot(databaseConfig),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

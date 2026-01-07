import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { HelperModule } from './helper/helper.module';
import { EvidenceModule } from './evidence/evidence.module';
import { AuditModule } from './audit/audit.module';
import { databaseConfig } from './helper/config';

@Module({
  imports: [
    HelperModule,
    TypeOrmModule.forRoot(databaseConfig),
    UserModule,
    AuthModule,
    EvidenceModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

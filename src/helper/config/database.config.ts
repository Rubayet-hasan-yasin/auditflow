import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Env } from './env';
import { User } from 'src/user/entities/user.entity';

export const entities = [User];

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: Env.DATABASE_PATH,
  autoLoadEntities: true,
  entities: [...entities],
  synchronize: Env.NODE_ENV !== 'production',
  logging: Env.NODE_ENV === 'development',
};

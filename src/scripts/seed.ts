import { DataSource } from 'typeorm';
import { User, UserRole } from '../user/entities/user.entity';
import { hashPassword } from '../helper/utils/bcrypt.util';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: './data/auditflow.db',
  entities: [User],
  synchronize: true,
});

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  await AppDataSource.initialize();
  const userRepository = AppDataSource.getRepository(User);

  // Clear existing users (optional - comment out if you want to keep existing data)
  await userRepository.clear();
  console.log('✅ Cleared existing users\n');

  // Seed users
  const users = [
    {
      email: 'admin@auditflow.com',
      password: await hashPassword('admin123'),
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      factoryId: undefined,
    },
    {
      email: 'buyer@auditflow.com',
      password: await hashPassword('buyer123'),
      firstName: 'John',
      lastName: 'Buyer',
      role: UserRole.BUYER,
      factoryId: undefined,
    },
    {
      email: 'buyer2@auditflow.com',
      password: await hashPassword('buyer123'),
      firstName: 'Jane',
      lastName: 'Purchaser',
      role: UserRole.BUYER,
      factoryId: undefined,
    },
    {
      email: 'factory1@auditflow.com',
      password: await hashPassword('factory123'),
      firstName: 'Factory',
      lastName: 'One',
      role: UserRole.FACTORY,
      factoryId: 'F001',
    },
    {
      email: 'factory2@auditflow.com',
      password: await hashPassword('factory123'),
      firstName: 'Factory',
      lastName: 'Two',
      role: UserRole.FACTORY,
      factoryId: 'F002',
    },
  ];

  for (const userData of users) {
    const user = userRepository.create(userData);
    await userRepository.save(user);
    console.log(`✅ Created user: ${userData.email} (${userData.role})`);
  }

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Test credentials:');
  console.log('   Admin:   admin@auditflow.com / admin123');
  console.log('   Buyer:   buyer@auditflow.com / buyer123');
  console.log('   Factory: factory1@auditflow.com / factory123 (F001)');
  console.log('   Factory: factory2@auditflow.com / factory123 (F002)');

  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});

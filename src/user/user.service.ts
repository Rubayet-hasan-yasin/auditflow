import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findActiveById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id, isActive: true } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findByRole(role: string): Promise<User[]> {
    return this.userRepository.find({ where: { role: role as any } });
  }

  async findByFactoryId(factoryId: string): Promise<User[]> {
    return this.userRepository.find({ where: { factoryId } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return this.findById(id);
  }

  async deactivate(id: string): Promise<User | null> {
    return this.update(id, { isActive: false });
  }

  async activate(id: string): Promise<User | null> {
    return this.update(id, { isActive: true });
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepository.count({ where: { email } });
    return count > 0;
  }
}

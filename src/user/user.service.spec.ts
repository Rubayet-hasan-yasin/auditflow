import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User, UserRole } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;

  const mockUser: User = {
    id: 'test-uuid-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.BUYER,
    factoryId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById('test-uuid-123');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-uuid-123' },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findActiveById', () => {
    it('should return an active user by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findActiveById('test-uuid-123');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-uuid-123', isActive: true },
      });
    });

    it('should return null if user is not active', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findActiveById('inactive-user-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, { ...mockUser, id: 'test-uuid-456' }];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should return empty array if no users', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByRole', () => {
    it('should return users by role', async () => {
      const adminUsers = [{ ...mockUser, role: UserRole.ADMIN }];
      mockRepository.find.mockResolvedValue(adminUsers);

      const result = await service.findByRole(UserRole.ADMIN);

      expect(result).toEqual(adminUsers);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
      });
    });
  });

  describe('findByFactoryId', () => {
    it('should return users by factory id', async () => {
      const factoryUsers = [{ ...mockUser, factoryId: 'factory-123' }];
      mockRepository.find.mockResolvedValue(factoryUsers);

      const result = await service.findByFactoryId('factory-123');

      expect(result).toEqual(factoryUsers);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { factoryId: 'factory-123' },
      });
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserData = {
        email: 'new@example.com',
        password: 'hashedPassword',
        firstName: 'Jane',
        lastName: 'Doe',
      };
      const createdUser = { ...mockUser, ...createUserData };

      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await service.create(createUserData);

      expect(result).toEqual(createdUser);
      expect(mockRepository.create).toHaveBeenCalledWith(createUserData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateData = { firstName: 'Updated' };
      const updatedUser = { ...mockUser, ...updateData };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.update('test-uuid-123', updateData);

      expect(result).toEqual(updatedUser);
      expect(mockRepository.update).toHaveBeenCalledWith(
        'test-uuid-123',
        updateData,
      );
    });

    it('should return null if user not found after update', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 });
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.update('non-existent-id', {
        firstName: 'Test',
      });

      expect(result).toBeNull();
    });
  });

  describe('deactivate', () => {
    it('should deactivate a user', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(deactivatedUser);

      const result = await service.deactivate('test-uuid-123');

      expect(result).toEqual(deactivatedUser);
      expect(mockRepository.update).toHaveBeenCalledWith('test-uuid-123', {
        isActive: false,
      });
    });
  });

  describe('activate', () => {
    it('should activate a user', async () => {
      const activatedUser = { ...mockUser, isActive: true };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(activatedUser);

      const result = await service.activate('test-uuid-123');

      expect(result).toEqual(activatedUser);
      expect(mockRepository.update).toHaveBeenCalledWith('test-uuid-123', {
        isActive: true,
      });
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete('test-uuid-123');

      expect(mockRepository.delete).toHaveBeenCalledWith('test-uuid-123');
    });
  });

  describe('existsByEmail', () => {
    it('should return true if email exists', async () => {
      mockRepository.count.mockResolvedValue(1);

      const result = await service.existsByEmail('test@example.com');

      expect(result).toBe(true);
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return false if email does not exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.existsByEmail('notfound@example.com');

      expect(result).toBe(false);
    });
  });
});

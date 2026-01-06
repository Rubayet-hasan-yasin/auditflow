import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '../user/entities/user.entity';
import * as bcryptUtil from '../helper/utils/bcrypt.util';

// Mock bcrypt util
jest.mock('../helper/utils/bcrypt.util');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.BUYER,
    factoryId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFactoryUser: User = {
    ...mockUser,
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'factory@example.com',
    role: UserRole.FACTORY,
    factoryId: 'F001',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.BUYER,
    };

    it('should successfully register a new buyer user', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue({
        ...mockUser,
        email: registerDto.email,
      });
      userRepository.save.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });
      (bcryptUtil.hashPassword as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should successfully register a factory user with factoryId', async () => {
      const factoryRegisterDto = {
        ...registerDto,
        role: UserRole.FACTORY,
        factoryId: 'F001',
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockFactoryUser);
      userRepository.save.mockResolvedValue(mockFactoryUser);
      (bcryptUtil.hashPassword as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(factoryRegisterDto);

      expect(result.user.role).toBe(UserRole.FACTORY);
      expect(result.user.factoryId).toBe('F001');
    });

    it('should throw ConflictException if user already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if factory role without factoryId', async () => {
      const factoryRegisterDto = {
        ...registerDto,
        role: UserRole.FACTORY,
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.register(factoryRegisterDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcryptUtil.comparePassword as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginDto.email);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        factoryId: mockUser.factoryId,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcryptUtil.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUserById', () => {
    it('should return user if found and active', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUserById(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id, isActive: true },
      });
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should return user if found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
});

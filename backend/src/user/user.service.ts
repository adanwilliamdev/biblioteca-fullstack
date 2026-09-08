import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Role, User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailOrNull(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.findByEmailOrNull(email);
    if (!user) {
      throw new NotFoundException(`Usuário não encontrado: ${email}`);
    }
    return user;
  }

  async register(dto: RegisterDto): Promise<User> {
    const jaExiste = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (jaExiste) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
    }
    const senhaHash = await bcrypt.hash(dto.senha, 10);
    return this.prisma.user.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senha: senhaHash,
        role: Role.USER,
      },
    });
  }

  async updateProfile(email: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findByEmail(email);
    return this.prisma.user.update({
      where: { id: user.id },
      data: { nome: dto.nome },
    });
  }

  toProfileResponse(user: User) {
    return {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
    };
  }
}

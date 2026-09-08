import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  /**
   * Equivalente a `authenticationManager.authenticate(...)` no AuthController.java,
   * usando o DaoAuthenticationProvider + BCryptPasswordEncoder configurados no Spring.
   */
  async validarCredenciais(email: string, senha: string): Promise<User> {
    const user = await this.userService.findByEmailOrNull(email);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }
    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }
    return user;
  }
}

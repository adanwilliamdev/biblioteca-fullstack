import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('users')
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async me(@CurrentUser() currentUser: User) {
    const user = await this.userService.findByEmail(currentUser.email);
    return this.userService.toProfileResponse(user);
  }

  @Put('me')
  async updateMe(@CurrentUser() currentUser: User, @Body() dto: UpdateProfileDto) {
    const user = await this.userService.updateProfile(currentUser.email, dto);
    return this.userService.toProfileResponse(user);
  }
}

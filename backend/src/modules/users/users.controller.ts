import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpStatus,
  InternalServerErrorException,
  HttpCode,
  Put,
  UseGuards,
  Req,
  ForbiddenException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmailVerificationService } from '../auth/email_verification_token.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { UserOwnershipGuard } from '../auth/guards/user-ownership.guard';
import { UserRoles, type AuthenticatedRequest } from '../../utils/types';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private emailVerificationService: EmailVerificationService,
  ) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Creates a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    schema: {
      example: {
        message:
          'Usuário criado com sucesso! Verifique seu email para ativar a conta.',
        user: {
          id: 1,
          email: 'johndoe@email.com',
          isEmailVerified: false,
          isActive: false,
        },
        verification: {
          token: 'verification-token',
          expiresInSeconds: 1800,
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists.',
    schema: {
      example: {
        message: 'Email already exist',
        error: 'Conflict',
        statusCode: 409,
      },
    },
  })
  async create(@Body() createUserDto: CreateUserDto) {
    let createdUser: { id: number; email: string } | undefined;

    try {
      const user = await this.usersService.create(createUserDto);
      createdUser = user;
      const verification =
        await this.emailVerificationService.sendVerificationEmail(user.id);
      return {
        message:
          'Usuário criado com sucesso! Verifique seu email para ativar a conta.',
        user: {
          id: user.id,
          email: user.email,
          isEmailVerified: false,
          isActive: false,
        },
        verification,
      };
    } catch (e) {
      if (createdUser) {
        try {
          await this.usersService.delete(createdUser.id);
        } catch (compensationError) {
          this.logger.error(
            `Failed to compensate user ${createdUser.id} after registration error`,
            compensationError,
          );
        }
      }
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException();
    }
  }
  @UseGuards(JwtAuthGuard, ActiveUserGuard, AdminGuard, UserOwnershipGuard)
  @Get()
  @ApiOperation({ summary: 'List all users, only accessible by admins' })
  @ApiResponse({
    status: 403,
    description: 'Access denied, only ADMIN can access this resource',
    schema: {
      example: {
        statusCode: 403,
        message: 'Only ADMIN can access this resource',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing JWT token',
    schema: {
      example: {
        message: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'List of users returned.',
    schema: {
      example: {
        users: [
          {
            id: 1,
            email: 'johndoe@email.com',
            isEmailVerified: false,
            isActive: false,
            role: { id: 2, role: 'USER' },
            status: { id: 1, status: 'INACTIVE' },
            images: [],
            f_projects: [],
            f_courses: [],
            f_profile_picture: null,
            f_education: [],
            f_experience: [],
          },
          {
            id: 2,
            email: 'janedoe@email.com',
            isEmailVerified: false,
            isActive: false,
            role: { id: 2, role: 'USER' },
            status: { id: 1, status: 'INACTIVE' },
            images: [],
            f_projects: [],
            f_courses: [],
            f_profile_picture: null,
            f_education: [],
            f_experience: [],
          },
        ],
      },
    },
  })
  async findAll() {
    const users = await this.usersService.findAll();
    return { users: users };
  }
  @UseGuards(JwtAuthGuard, ActiveUserGuard, UserOwnershipGuard)
  @Get(':id')
  @ApiOperation({
    summary:
      'Get user by ID, only accessible by the user themselves or an admin',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing JWT token',
    schema: {
      example: {
        message: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'Access denied, only the user themselves or an admin can access this resource',
    schema: {
      example: {
        message: 'You dont have permission to access this resource',
        statusCode: 403,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Returned user by a provided ID.',
    schema: {
      example: {
        user: {
          id: 1,
          email: 'johndoe@email.com',
          isEmailVerified: false,
          isActive: false,
          role: { id: 2, role: 'USER' },
          status: { id: 1, status: 'INACTIVE' },
          images: [],
          f_projects: [],
          f_courses: [],
          f_profile_picture: null,
          f_education: [],
          f_experience: [],
        },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    return { user: user };
  }
  @UseGuards(JwtAuthGuard, ActiveUserGuard, UserOwnershipGuard)
  @Put(':id')
  @ApiOperation({
    summary:
      "Update a user's information, only by the user themselves or an admin",
  })
  @ApiResponse({
    status: 200,
    description: 'User information updated successfully',
    schema: {
      example: {
        message: 'User information updated successfully',
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing JWT token',
    schema: {
      example: {
        message: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'Access denied, only the user themselves or an admin can access this resource',
    schema: {
      example: {
        message: 'You dont have permission to access this resource',
        statusCode: 403,
      },
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const requestingUser = req.user;
    const { role_id, status_id } = updateUserDto;
    if (
      (role_id || status_id) &&
      requestingUser.role !== String(UserRoles.SYSADMIN)
    ) {
      throw new ForbiddenException('Only ADMIN can change role or status');
    }
    await this.usersService.update(+id, updateUserDto);
    return {
      message: 'User information updated successfully',
      statusCode: 200,
    };
  }
  @ApiOperation({ summary: 'Inactivate a user, only accessible by admins' })
  @ApiResponse({
    status: 200,
    description: 'User inactivated successfully',
    schema: {
      example: {
        message: 'User inactivated successfully',
        statusCode: 200,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied, only ADMIN can access this resource',
    schema: {
      example: {
        statusCode: 403,
        message: 'Only ADMIN can access this resource',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing JWT token',
    schema: {
      example: {
        message: 'Unauthorized',
        statusCode: 401,
      },
    },
  })
  @UseGuards(JwtAuthGuard, AdminGuard, ActiveUserGuard)
  @Patch(':id/inactivate')
  async inactivate(@Param('id') id: string) {
    await this.usersService.update(+id, {
      status_id: 1,
    });

    return { message: 'User inactivated successfully', statusCode: 200 };
  }
}

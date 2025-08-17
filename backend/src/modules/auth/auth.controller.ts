import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
  UseGuards,
  Request,
  Get,
  BadRequestException,
  Render,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdatePasswordDto } from '../users/dto/update-password-user.dto';
import { HashService } from '../../common/services/hash.service';
import { EmailVerificationService } from './email_verification_token.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private hashService: HashService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    const user = await this.usersService.validateUser(
      loginUserDto.email,
      loginUserDto.password_hash,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verifica se o email foi verificado
    if (!user.verified_email) {
      throw new UnauthorizedException({
        message: 'Email is not verified, check your mail box',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
        canResend: true,
      });
    }

    // Verifica se a conta está ativa
    if (user.status_id !== 2) {
      throw new UnauthorizedException('inactive account. please contact admin');
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Login Successfully',
      user,
      access_token: token,
    };
  }

  @Get('verify-email')
  @Render('verify-email')
  root() {
    return { message: 'Hello world!' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const success = await this.emailVerificationService.verifyEmailWithCode(
      verifyEmailDto.token,
      verifyEmailDto.code,
    );

    if (success) {
      return {
        message: '🎉 Email verificado com sucesso! Sua conta foi ativada.',
        verified: true,
        next_steps: {
          action: 'Fazer login',
          url: '/auth/login',
        },
      };
    }

    throw new BadRequestException('Email verifications failed');
  }

  /**
   * Reenviar email de verificação
   */
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    await this.emailVerificationService.resendVerificationEmail(
      resendDto.email,
    );

    return {
      message: 'Email de verificação reenviado com sucesso!',
      instructions: 'Verifique sua caixa de email (incluindo spam)',
      expires_in: '30 minutos',
    };
  }

  /**
   * Status de verificação de email
   */
  @Get('verification-status')
  @UseGuards(JwtAuthGuard)
  async getVerificationStatus(@Request() req) {
    const status = await this.emailVerificationService.getVerificationStatus(
      req.user.sub,
    );

    return {
      user: req.user,
      verification: status,
    };
  }

  /**
   * Obtém perfil do usuário autenticado
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.sub);
    return {
      message: 'Perfil obtido com sucesso',
      user,
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const user = await this.usersService.findByEmailWithPassword(
      req.user.email,
    );

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Valida senha atual
    const isCurrentPasswordValid = await this.hashService.comparePassword(
      updatePasswordDto.current_password,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Senha atual inválida');
    }

    // Atualiza senha
    await this.usersService.updatePassword(
      user.id,
      updatePasswordDto.new_password,
    );

    return {
      message: 'Senha atualizada com sucesso',
    };
  }
}

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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { UpdatePasswordDto } from '../users/dto/update-password-user.dto';
import { EmailVerificationService } from './email_verification_token.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UserStatus } from 'src/utils/types';

@Controller('auth')
export class AuthController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailVerificationService: EmailVerificationService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    const user = await this.usersService.validateUser(
      loginUserDto.email,
      loginUserDto.password,
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
    if (user.status_id !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('inactive account. please contact admin');
    }

    const payload = {
      sub: user.id,
      role: user.role_id,
      status: user.status_id,
    };
    const token = this.jwtService.sign(payload);

    return {
      message: 'Login Successfully',
      user,
      access_token: token,
    };
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

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(req.user.email, updatePasswordDto);

    return {
      message: 'Password updated!',
    };
  }

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {
    // Inicia o fluxo OAuth2 — o guard redireciona para o Google automaticamente
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    const user = req.user;
    const payload = { sub: user.id, role: user.role_id, status: user.status_id };
    const token = this.jwtService.sign(payload);

    // Redireciona com o token na query string — frontend deve capturar e salvar
    return res.redirect(`/auth/google/success?token=${token}`);
  }

  @Get('google/success')
  @UseGuards(JwtAuthGuard)
  googleSuccess(@Request() req) {
    return {
      message: 'Google OAuth2 login successful',
      user: req.user,
    };
  }
}

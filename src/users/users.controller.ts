import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    const user = req.user;
    return {
      id: (user._id as any).toString(),
      nickName: user.nickName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      about: user.about,
      points: user.points,
      createdAt: user.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Request() req, @Body() data: any) {
    const updatedUser = await this.usersService.updateUser(
      (req.user._id as any).toString(),
      data,
    );
    if (!updatedUser) {
      throw new NotFoundException('Пользователь не найден');
    }
    return {
      id: updatedUser._id.toString(),
      nickName: updatedUser.nickName,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatar,
      about: updatedUser.about,
      points: updatedUser.points,
      createdAt: updatedUser.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', { storage: multer.memoryStorage() }),
  )
  async updateAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Файл аватара не предоставлен');
    }
    const userId = req.user._id;
    const updatedUser = await this.usersService.updateUserAvatar(userId, file);

    if (!updatedUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    return {
      id: updatedUser._id.toString(),
      nickName: updatedUser.nickName,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatar,
      about: updatedUser.about,
      points: updatedUser.points,
      createdAt: updatedUser.createdAt,
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const user = await this.usersService.findById(id);
    if (!user) {
      return null;
    }
    return {
      id: user._id.toString(),
      nickName: user.nickName,
      email: user.email,
      avatarUrl: user.avatar,
      about: user.about,
      points: user.points,
      createdAt: user.createdAt,
    };
  }

  @Get()
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return users.map((user) => ({
      id: user._id.toString(),
      nickName: user.nickName,
      avatarUrl: user.avatar,
      points: user.points,
    }));
  }
}

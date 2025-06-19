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
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import * as multer from "multer";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { Types } from "mongoose";
import { Request as ExpressRequest } from "express";

interface JwtUser {
  _id: string;
}

interface RequestWithUser extends ExpressRequest {
  user: JwtUser;
}

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private buildAvatarUrl(req: ExpressRequest, avatarPath?: string) {
    if (!avatarPath) return null;
    const protocol = req.protocol;
    const host = req.get("host");
    return `${protocol}://${host}${avatarPath}`;
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@Request() req: RequestWithUser) {
    const user = await this.usersService.findById(req.user._id.toString());
    if (!user) throw new NotFoundException("Пользователь не найден");

    return {
      id: user._id.toString(),
      nickName: user.nickName,
      email: user.email,
      avatar: this.buildAvatarUrl(req, user.avatar),
      about: user.about,
      points: user.points,
      createdAt: user.createdAt,
      progressHistory: user.progressHistory || [],
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me")
  async updateMe(@Request() req: RequestWithUser, @Body() data: any) {
    const updatedUser = await this.usersService.updateUser(
      req.user._id.toString(),
      data,
    );
    if (!updatedUser) {
      throw new NotFoundException("Пользователь не найден");
    }
    return {
      id: updatedUser._id.toString(),
      nickName: updatedUser.nickName,
      email: updatedUser.email,
      avatar: this.buildAvatarUrl(req, updatedUser.avatar),
      about: updatedUser.about,
      points: updatedUser.points,
      createdAt: updatedUser.createdAt,
      progressHistory: updatedUser.progressHistory || [],
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("me/avatar")
  @UseInterceptors(
    FileInterceptor("avatar", { storage: multer.memoryStorage() }),
  )
  async updateAvatar(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("Файл аватара не предоставлен");
    }
    const userId = req.user._id;
    const updatedUser = await this.usersService.updateUserAvatar(userId, file);

    if (!updatedUser) {
      throw new NotFoundException("Пользователь не найден");
    }

    return {
      id: updatedUser._id.toString(),
      nickName: updatedUser.nickName,
      email: updatedUser.email,
      avatar: this.buildAvatarUrl(req, updatedUser.avatar),
      about: updatedUser.about,
      points: updatedUser.points,
      createdAt: updatedUser.createdAt,
      progressHistory: updatedUser.progressHistory || [],
    };
  }

  @Get(":id")
  async getUserById(@Param("id") id: string, @Request() req: ExpressRequest) {
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
      avatar: this.buildAvatarUrl(req, user.avatar),
      about: user.about,
      points: user.points,
      createdAt: user.createdAt,
      progressHistory: user.progressHistory || [],
    };
  }

  @Get()
  async getAllUsers(@Request() req: ExpressRequest) {
    const users = await this.usersService.findAll();
    return users.map((user) => ({
      id: user._id.toString(),
      nickName: user.nickName,
      avatar: this.buildAvatarUrl(req, user.avatar),
      points: user.points,
    }));
  }
}

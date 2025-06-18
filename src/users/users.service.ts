import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User, UserDocument, ProgressRecord } from "./schemas/user.schema";
import { Model } from "mongoose";
import * as bcrypt from "bcrypt";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByNickName(nickName: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ nickName }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(
    nickName: string,
    email: string,
    hashedPassword: string,
  ): Promise<UserDocument> {
    const createdUser = new this.userModel({
      nickName,
      email,
      password: hashedPassword,
    });
    return createdUser.save();
  }

  async updateUser(
    id: string,
    data: Partial<
      Pick<User, "nickName" | "email" | "password" | "avatar" | "about">
    >,
  ): Promise<UserDocument | null> {
    if (data.nickName) {
      const existingUser = await this.userModel.findOne({
        nickName: data.nickName,
      });
      if (existingUser && existingUser._id.toString() !== id) {
        throw new ConflictException("nickName уже используется");
      }
    }

    if (data.email) {
      const existingUser = await this.userModel.findOne({ email: data.email });
      if (existingUser && existingUser._id.toString() !== id) {
        throw new ConflictException("Email уже используется");
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async updateUserAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UserDocument | null> {
    const uploadDir = path.resolve(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      return null;
    }

    if (user.avatar) {
      const oldFilePath = path.join(uploadDir, path.basename(user.avatar));
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const fileName = `${userId}-${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    user.avatar = `/uploads/${fileName}`;
    return user.save();
  }

  async addPointsToUser(
    userId: string,
    points: number,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(userId, { $inc: { points } }, { new: true })
      .exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().sort({ points: -1 }).exec();
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ resetPasswordToken: token }).exec();
  }

  async updateUserProgress(
    userId: string,
    newRecord: ProgressRecord,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findById(userId);
    if (!user) return null;

    const existingIndex = user.progressHistory.findIndex(
      (r) => r.path === newRecord.path,
    );

    if (existingIndex >= 0) {
      const existing = user.progressHistory[existingIndex];
      if (existing.points !== newRecord.points) {
        user.points += newRecord.points - existing.points;
        user.progressHistory[existingIndex] = newRecord;
      }
    } else {
      user.progressHistory.push(newRecord);
      user.points += newRecord.points;
    }

    return user.save();
  }

  async setRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() +
        parseInt(process.env.JWT_REFRESH_EXPIRES_IN || "604800"), // 7 дней по умолчанию
    );

    await this.userModel
      .findByIdAndUpdate(userId, {
        refreshToken,
        refreshTokenExpires: expiresAt,
      })
      .exec();
  }

  async findByRefreshToken(refreshToken: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        refreshToken,
        refreshTokenExpires: { $gt: new Date() },
      })
      .exec();
  }

  async invalidateTokens(userId: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        refreshToken: null,
        refreshTokenExpires: null,
      })
      .exec();
  }
}

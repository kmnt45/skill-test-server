import { ObjectId } from 'mongoose';

export interface User {
  _id: string | ObjectId;
  email: string;
  nickName: string;
  password: string;
}

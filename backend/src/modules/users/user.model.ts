import { Schema, model, Document, Types } from 'mongoose';
import { ROLES, Role } from '../../common/constants/roles';
import { comparePassword, hashPassword } from '../../common/utils/password';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  avatar?: string;
  phone?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  tokenVersion: number;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  wishlist: Types.ObjectId[];
  recentlyViewed: { product: Types.ObjectId; viewedAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  fullName: string;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    avatar: { type: String },
    phone: { type: String, trim: true },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product', index: true }],
    recentlyViewed: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.virtual('fullName').get(function (this: IUser): string {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.pre('save', async function hashOnSave(next) {
  if (!this.isModified('password')) return next();
  this.password = await hashPassword(this.password);
  next();
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return comparePassword(candidate, this.password);
};

userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

export const User = model<IUser>('User', userSchema);

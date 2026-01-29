import mongoose, { Schema, Document } from 'mongoose';
import { IStop } from './Stop';

export interface IRoute extends Document {
  name: string;
  number: string;
  stops: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const RouteSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    stops: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Stop',
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Route || mongoose.model<IRoute>('Route', RouteSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IStop extends Document {
  name: string;
  lat: number;
  lng: number;
  eta?: string;
  cityType?: 1 | 2 | 3;
  createdAt?: Date;
  updatedAt?: Date;
}

const StopSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    eta: {
      type: String,
      required: false,
    },
    cityType: {
      type: Number,
      enum: [1, 2, 3],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Stop || mongoose.model<IStop>('Stop', StopSchema);

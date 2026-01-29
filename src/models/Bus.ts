import mongoose, { Schema, Document } from 'mongoose';

export interface IBus extends Document {
  number: string;
  routeId: mongoose.Types.ObjectId;
  lat: number;
  lng: number;
  status: 'active' | 'idle' | 'delayed' | 'maintenance';
  driver: string;
  lastUpdated: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const BusSchema: Schema = new Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'idle', 'delayed', 'maintenance'],
      default: 'idle',
      required: true,
    },
    driver: {
      type: String,
      required: true,
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Bus || mongoose.model<IBus>('Bus', BusSchema);

# MongoDB Integration Guide

This project now uses MongoDB for data storage. Follow these steps to set up and use MongoDB.

## Setup Instructions

### 1. Install MongoDB

You can either:
- Use **MongoDB Atlas** (Cloud): https://www.mongodb.com/cloud/atlas
- Install **MongoDB locally**: https://www.mongodb.com/try/download/community

### 2. Configure Environment Variables

Create a `.env.local` file in the `web` directory with your MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/bus-system
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bus-system

NEXT_PUBLIC_API_URL=http://localhost:9002
```

### 3. Seed the Database

After setting up MongoDB, seed the database with initial data by calling the seed API:

```bash
# Using curl
curl -X POST http://localhost:9002/api/seed

# Or visit in browser
http://localhost:9002/api/seed
```

This will populate your database with sample routes, stops, and buses.

## API Endpoints

### Routes
- `GET /api/routes` - Get all routes
- `GET /api/routes/[id]` - Get a specific route
- `POST /api/routes` - Create a new route
- `PUT /api/routes/[id]` - Update a route
- `DELETE /api/routes/[id]` - Delete a route

### Stops
- `GET /api/stops` - Get all stops (optional query: `?cityType=1`)
- `POST /api/stops` - Create a new stop

### Buses
- `GET /api/buses` - Get all buses (optional queries: `?routeId=xxx&status=active`)
- `GET /api/buses/[id]` - Get a specific bus
- `POST /api/buses` - Create a new bus
- `PUT /api/buses/[id]` - Update a bus
- `DELETE /api/buses/[id]` - Delete a bus

### Seed
- `POST /api/seed` - Seed database with initial data

## Database Models

### Stop
- `name` (String, required)
- `lat` (Number, required)
- `lng` (Number, required)
- `eta` (String, optional)
- `cityType` (Number, optional: 1, 2, or 3)

### Route
- `name` (String, required)
- `number` (String, required, unique)
- `stops` (Array of Stop ObjectIds)

### Bus
- `number` (String, required, unique)
- `routeId` (ObjectId reference to Route)
- `lat` (Number, required)
- `lng` (Number, required)
- `status` (String, enum: 'active', 'idle', 'delayed', 'maintenance')
- `driver` (String, required)
- `lastUpdated` (Date, required)

## Fallback Behavior

If MongoDB is not available or not configured, the application will automatically fall back to using static data from `src/lib/data.ts`. This ensures the application continues to work even without a database connection.

## Troubleshooting

1. **Connection Error**: Make sure your `MONGODB_URI` is correct and MongoDB is running
2. **No Data**: Run the seed endpoint to populate initial data
3. **Type Errors**: Make sure all environment variables are set correctly

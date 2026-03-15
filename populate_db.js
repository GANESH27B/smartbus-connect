
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://bganesh1785_db_user:Ganesh2005@cluster0.cfn8syr.mongodb.net/?appName=Cluster0";

async function populateDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    
    const stopSchema = new mongoose.Schema({
      name: String,
      lat: Number,
      lng: Number,
      cityType: Number
    }, { collection: 'stops' });
    
    const busSchema = new mongoose.Schema({
      number: String,
      routeId: String,
      lat: Number,
      lng: Number,
      status: String,
      driver: String,
      lastUpdated: String
    }, { collection: 'buses' });

    const Stop = mongoose.models.Stop || mongoose.model('Stop', stopSchema);
    const Bus = mongoose.models.Bus || mongoose.model('Bus', busSchema);
    
    // Data from lib/data.ts (the real Indian stops)
    const kluStops = [
      { name: 'Krishnankoil Junction', lat: 9.5815, lng: 77.6750, cityType: 2 },
      { name: 'KLU Main Gate', lat: 9.5788, lng: 77.6766, cityType: 1 },
      { name: 'Srivilliputhur Bus Stand', lat: 9.5094, lng: 77.6322, cityType: 1 },
      { name: 'Watrap Bus Stand', lat: 9.6105, lng: 77.6361, cityType: 1 },
      { name: 'Rajapalayam Bus Stand', lat: 9.4522, lng: 77.5539, cityType: 1 }
    ];

    console.log("Adding stops...");
    for (const stop of kluStops) {
      const exists = await Stop.findOne({ name: stop.name });
      if (!exists) {
        await Stop.create(stop);
        console.log(` - Created stop: ${stop.name}`);
      } else {
        console.log(` - Stop already exists: ${stop.name}`);
      }
    }

    // Add some buses
    const demoBuses = [
      { number: 'KLU-001', routeId: 'route-klu', lat: 9.5795, lng: 77.6755, status: 'active', driver: 'Arun', lastUpdated: new Date().toISOString() },
      { number: 'KLU-002', routeId: 'route-klu', lat: 9.5150, lng: 77.6350, status: 'active', driver: 'Selvam', lastUpdated: new Date().toISOString() }
    ];

    console.log("Adding buses...");
    for (const bus of demoBuses) {
      const exists = await Bus.findOne({ number: bus.number });
      if (!exists) {
        await Bus.create(bus);
        console.log(` - Created bus: ${bus.number}`);
      } else {
        console.log(` - Bus already exists: ${bus.number}`);
      }
    }

    console.log("Done!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

populateDB();

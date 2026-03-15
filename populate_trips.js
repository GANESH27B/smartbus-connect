
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://bganesh1785_db_user:Ganesh2005@cluster0.cfn8syr.mongodb.net/?appName=Cluster0";

async function populateTrips() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    
    const stopSchema = new mongoose.Schema({
      name: String,
      lat: Number,
      lng: Number,
      cityType: Number
    }, { collection: 'stops' });
    
    const routeSchema = new mongoose.Schema({
      name: String,
      number: String,
      stops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stop' }]
    }, { collection: 'routes' });

    const Stop = mongoose.models.Stop || mongoose.model('Stop', stopSchema);
    const Route = mongoose.models.Route || mongoose.model('Route', routeSchema);
    
    const trip1Stops = [
      { name: 'KLU Main Gate', lat: 9.5788, lng: 77.6766, cityType: 1 },
      { name: 'Krishnankoil Junction', lat: 9.5815, lng: 77.6750, cityType: 2 },
      { name: 'Madavar Vilagam', lat: 9.5120, lng: 77.6350, cityType: 3 },
      { name: 'Srivilliputhur Bus Stand', lat: 9.5094, lng: 77.6322, cityType: 1 }
    ];

    const trip2Stops = [
      { name: 'KLU North Gate', lat: 9.5820, lng: 77.6780, cityType: 3 },
      { name: 'Watrap Bus Stand', lat: 9.6105, lng: 77.6361, cityType: 1 },
      { name: 'Sundarapandiam', lat: 9.6250, lng: 77.6450, cityType: 2 },
      { name: 'Rajapalayam Bus Stand', lat: 9.4522, lng: 77.5539, cityType: 1 }
    ];

    async function createStopsInDB(stopsArray) {
      const ids = [];
      for (const stop of stopsArray) {
        let dbStop = await Stop.findOne({ name: stop.name });
        if (!dbStop) {
          dbStop = await Stop.create(stop);
          console.log(` - Created stop: ${stop.name} (Type ${stop.cityType})`);
        } else {
          // Update cityType if changed
          dbStop.cityType = stop.cityType;
          dbStop.lat = stop.lat;
          dbStop.lng = stop.lng;
          await dbStop.save();
          console.log(` - Updated stop: ${stop.name} (Type ${stop.cityType})`);
        }
        ids.push(dbStop._id);
      }
      return ids;
    }

    console.log("Processing Trip 1 stops...");
    const trip1Ids = await createStopsInDB(trip1Stops);
    
    console.log("Processing Trip 2 stops...");
    const trip2Ids = await createStopsInDB(trip2Stops);

    // Create Routes
    const r1 = await Route.findOneAndUpdate(
      { number: "TRIP-01" },
      { name: "KLU Campus Express", stops: trip1Ids },
      { upsert: true, new: true }
    );
    console.log(" - Route TRIP-01 ready");

    const r2 = await Route.findOneAndUpdate(
      { number: "TRIP-02" },
      { name: "Watrap Link", stops: trip2Ids },
      { upsert: true, new: true }
    );
    console.log(" - Route TRIP-02 ready");

    console.log("Database successfully marked and populated with Trip 1 & 2!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

populateTrips();

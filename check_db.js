
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://bganesh1785_db_user:Ganesh2005@cluster0.cfn8syr.mongodb.net/?appName=Cluster0";

async function checkStops() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    
    const stopSchema = new mongoose.Schema({
      name: String,
      lat: Number,
      lng: Number,
      cityType: Number
    }, { collection: 'stops' });
    
    const Stop = mongoose.models.Stop || mongoose.model('Stop', stopSchema);
    
    const stops = await Stop.find({});
    console.log(`Found ${stops.length} stops:`);
    stops.forEach(s => console.log(` - ${s.name} (${s.lat}, ${s.lng})`));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkStops();

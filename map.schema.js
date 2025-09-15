import mongoose from "mongoose";

const mapSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier: { type: Number, required: true },
  icons: [
    {
      alt: { type: String, required: true },
      badge: { type: Number, required: false }
    }
  ]
});

const Map = mongoose.model("Map", mapSchema);
export default Map;

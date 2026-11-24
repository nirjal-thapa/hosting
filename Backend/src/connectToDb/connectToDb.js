import mongoose from "mongoose";

const connectToDb = async () => {
  // Local MongoDB by default; set MONGODB_URI to use another server (e.g. Atlas).
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mern");
  console.log("Connected to db");
};

export default connectToDb;

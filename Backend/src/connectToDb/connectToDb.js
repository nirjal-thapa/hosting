import mongoose from "mongoose";

const connectToDb = async () => {
  await mongoose.connect("mongodb+srv://nirjalthapa5_db_user:aLZl8Y5rWTDHzp4d@cluster0.5r8jhm8.mongodb.net");
  console.log("Connected to db");
};

export default connectToDb;

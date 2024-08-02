import mongoose from "mongoose";

const connectToMongoDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`Connected to MongoDB`);
    return conn;
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

mongoose.connection.on("connected", () => {
  // console.log("Mongoose connected to DB Cluster");
});

mongoose.connection.on("error", (error) => {
  console.error(error.message);
});

mongoose.connection.on("disconnected", () => {
  // console.log("Mongoose Disconnected");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

export default connectToMongoDb;

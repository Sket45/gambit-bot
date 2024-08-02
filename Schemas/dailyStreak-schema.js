import mongoose from "mongoose";

const dailyStreakSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model("dailyStreak-schema", dailyStreakSchema);

export default Profile;

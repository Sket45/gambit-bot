import mongoose from "mongoose";

const dailySchema = new mongoose.Schema(
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

const Profile = mongoose.model("daily-schema", dailySchema);

export default Profile;

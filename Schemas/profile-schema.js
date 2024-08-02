import mongoose from "mongoose";

const reqString = {
  type: String,
  required: true,
};
const reqNumber = {
  type: Number,
  required: true,
};

const profileSchema = new mongoose.Schema({
  _id: reqString,
  isnew: {
    type: Boolean,
    required: true,
  },
  gambleCount: reqNumber,
  id: reqNumber,
  rank: reqString,
  logo: reqString,
  balance: reqNumber,
  dailyStreak: reqNumber,
  exp: reqNumber,
});

const Profile = mongoose.model("profile-schema", profileSchema);

export default Profile;

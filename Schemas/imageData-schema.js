import mongoose from "mongoose";

const reqString = {
  type: String,
  required: true,
};

const imageDataSchema = new mongoose.Schema({
  _id: reqString,
  img: {
    data: {
      type: Buffer,
      required: true,
    },
    contentType: reqString,
  },
});

const imageData = mongoose.model("imageData-schema", imageDataSchema);

export default imageData;

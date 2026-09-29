import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  incident: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
}

const commentSchema = new Schema<IComment>(
  {
    incident: {
      type: Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model<IComment>("Comment", commentSchema);

export default Comment;
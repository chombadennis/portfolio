// lib/models/Post.ts
import { Schema, model, models, InferSchemaType } from "mongoose";
import { connectDB } from "@/lib/db";

const PostSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true }, // stored as HTML
    excerpt: { type: String, default: "" },
    featured_image_url: { type: String, default: "" },
    author_name: { type: String, required: true },
    published: { type: Boolean, default: false, index: true },
    category: { type: String, default: "" },
    content_background: { type: String, default: "#ffffff" },
    content_font: { type: String, default: "Arial, sans-serif" },
  },
  { timestamps: true }
);

// 🏎️ Indexes for query performance
PostSchema.index({ published: 1, createdAt: -1 });
PostSchema.index({ category: 1, published: 1, createdAt: -1 });

PostSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const obj = ret as Record<string, unknown> & {
      _id?: unknown;
      createdAt?: Date;
      updatedAt?: Date;
    };

    obj.id = String(obj._id);
    delete obj._id;

    if (obj.createdAt) {
      obj.created_at = new Date(obj.createdAt).toISOString();
      delete obj.createdAt;
    }

    if (obj.updatedAt) {
      obj.updated_at = new Date(obj.updatedAt).toISOString();
      delete obj.updatedAt;
    }
  },
});

export type Post = InferSchemaType<typeof PostSchema> & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

export async function PostModel() {
  await connectDB();
  return models.Post || model("Post", PostSchema);
}

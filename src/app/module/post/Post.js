
    const { Schema, model } = require("mongoose");
    const ObjectId = Schema.Types.ObjectId;

    const postSchema = new Schema(
    {
        
    },
    {
        timestamps: true,
    }
    );

    const Post = model("Post", postSchema);

    module.exports = Post;
    
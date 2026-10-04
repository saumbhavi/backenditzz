import mongoose from "mongoose";
import mongooseAgregatePaginate from "mongoose-aggregate-paginate-v2";

const { Schema } = mongoose;

const videoSchema=new Schema(
    {
        videoFile:{
            type:String,
            required:true
        },
        thumbnail:{
            type:String,
            required:true
        },title:{
            type:String,
            required:true,
            trim:true,
            index:true
        },description:{
            type:String,
            required:true,
            trim:true
        },
        duration:{
            type:Number,
            required:true
        },
        views:{
            type:Number,
            default:0
        },isPublished:{
            type:Boolean,
            default:true
        },owner:{
            type:Schema.Types.ObjectId, 
            ref:"User",
        }

    },
    {
        timestamps:true
    }
)
videoSchema.plugin(mongooseAgregatePaginate)
export const Video=mongoose.model("Video",videoSchema)
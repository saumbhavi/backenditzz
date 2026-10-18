import mongoose ,{Schema} from "mongoose";
const subscriptionSchema=new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,  //ONE WHO IS SUBSCRIBING 
        ref:"User",
        
    },channel:{
        type:Schema.Types.ObjectId,  //CHANNEL TO WHICH SUBSCRIBER IS SUBSCRIBING
        ref:"User",

    }
});
export const Subscription=mongoose.model("Subscription",subscriptionSchema)
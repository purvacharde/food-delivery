import mongoose from "mongoose";

export const connectDB = async () =>{
    await mongoose.connect('mongodb+srv://purvacharde0501_db_user:purvacharde05@cluster0.llzn1ai.mongodb.net/food-delivery').then(()=>console.log("DB Connected"));
}
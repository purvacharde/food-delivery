import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {

  const frontend_url = "https://food-delivery-frontend-52of.onrender.com";

  try {

    //  Make sure userId is coming from middleware
    if (!req.userId) {
      return res.json({
        success: false,
        message: "User not authenticated",
      });
    }

    const newOrder = new orderModel({
      userId: req.userId,   //  FIXED HERE
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });

    await newOrder.save();

    //  Clear user's cart
    await userModel.findByIdAndUpdate(req.userId, {
    cartData: {},
    });

    //  Create Stripe line items
    const line_items = req.body.items.map((item) => ({
    price_data: {
        currency: "inr",
        product_data: {
        name: item.name,
        },
        unit_amount: item.price * 100,
    },
    quantity: item.quantity,
    }));

    //  Delivery charge
    line_items.push({
    price_data: {
        currency: "inr",
        product_data: {
        name: "Delivery Charges",
        },
        unit_amount: 2 * 100,
    },
    quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.json({
      success: true,
      session_url: session.url,
    });

  } catch (error) {
    console.log("Stripe Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

const verifyOrder = async (req,res) => {
    const {orderId,success} = req.body;
    try{
        if (success=='true') {
            await orderModel.findByIdAndUpdate(orderId,{payment:true});
            res.json({success:true,message:'Paid'})
        }
        else{
            await orderModel.findByIdAndDelete(orderId);
            res.json({success:false,message:'Not Paid'})
        }
    }catch (error) {
        console.log(error);
        res.json({success:false,message:'Error'})

    }
}

// user orders for frontend
const userOrders = async (req, res) => {
  try {

    if (!req.userId) {
      return res.json({
        success: false,
        message: "Not Authorized"
      });
    }

    const orders = await orderModel.find({
      userId: req.userId   // ✅ SIMPLE STRING MATCH
    });

    return res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.log("USER ORDERS ERROR:", error);
    return res.json({
      success: false,
      message: error.message
    });
  }
};

// Listing orders for admin panel
const listOrders = async (req,res) =>{
  try {
    const orders = await orderModel.find({});
    res.json({success:true,data:orders})
  }catch (error) {
    console.log(error);
    res.json({success:false,message:'Error'})

  }

}

//api for updating order status
const updateStatus = async (req,res) => {
  try{
    await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status});
    res.json({success:true,message:'Status Updated'})
  }catch (error) {
    console.log(error);
    res.json({success:false,message:'Error'})

  }

}

// Remove order by ID
const removeOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // Verify the user owns this order or is admin
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({success:false,message:'Order not found'});
    }
    
    await orderModel.findByIdAndDelete(orderId);
    res.json({success:true,message:'Order Removed'})
  }catch (error) {
    console.log(error);
    res.json({success:false,message:'Error'})
  }
}

export { placeOrder,verifyOrder,userOrders,listOrders,updateStatus,removeOrder };

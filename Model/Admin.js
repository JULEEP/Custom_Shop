import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
        },
        phoneNumber: {
            type: String,
        },
        password: {
            type: String,
            trim: true,
        },
        totalEarning: [{
            type: String,

        }],
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);


const AdminModel = mongoose.model("Admin", adminSchema);
export default AdminModel;

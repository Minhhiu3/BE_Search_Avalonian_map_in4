import mongoose from "mongoose";
import { DB_URL } from "./enviroment.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(` Chúc mừng bố đã kết nối db thành công vào: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(` dcm kết nối db 7 bại rồi: ${error.message}`);
    process.exit(1); // dừng app khi lỗi kết nối
  }
};

export default connectDB;

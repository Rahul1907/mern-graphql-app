import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is missing');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;

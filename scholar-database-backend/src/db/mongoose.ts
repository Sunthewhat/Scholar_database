import * as mongoose from 'mongoose';

const InitMongo = async () => {
	const CONNECTION_URI = Bun.env.MONGO;
	if (!CONNECTION_URI) throw new Error('Missing MongoDB URI');
	try {
		console.log('Connecting to MongoDB');
		const mongo = await mongoose.connect(CONNECTION_URI, {
			timeoutMS: 10000,
		});
		console.log('MongoDB connected!');
		return mongo;
	} catch (e) {
		throw new Error('Cannot connect to MongoDB');
	}
};

export { InitMongo };

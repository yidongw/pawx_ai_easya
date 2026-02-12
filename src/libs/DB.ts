import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';

const rawUri = (process.env.MONGODB_URI ?? '').trim();
const cleanedUri = rawUri.replace(/^['"]|['"]$/g, '');
if (!cleanedUri) {
  throw new Error('MONGODB_URI is not set');
}
const uri = /^mongodb(\+srv)?:\/\//i.test(cleanedUri)
  ? cleanedUri
  : `mongodb+srv://${cleanedUri}`;

const globalForMongo = globalThis as unknown as {
  mongoClientPromise?: Promise<MongoClient>;
};

const createClient = () =>
  new MongoClient(uri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

const getClient = async () => {
  if (!globalForMongo.mongoClientPromise) {
    const client = createClient();
    globalForMongo.mongoClientPromise = client.connect().then(() => client);
  }
  return globalForMongo.mongoClientPromise;
};

export const getDb = async () => {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB ?? 'pawx');
};

const encodeValue = (value: string) => Buffer.from(value, 'utf8').toString('base64');
const decodeValue = (value: string) => Buffer.from(value, 'base64').toString('utf8');

type WalletDoc = {
  _id?: ObjectId;
  telegramUserId: string;
  evmAddress: string;
  solAddress: string;
  evmPrivateKey: string;
  solPrivateKey: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WalletRecord = {
  id: string;
  telegramUserId: string;
  evmAddress: string;
  solAddress: string;
  evmPrivateKey: string;
  solPrivateKey: string;
  createdAt: Date;
  updatedAt: Date;
};

const mapToRecord = (doc: WalletDoc): WalletRecord => ({
  id: doc._id?.toHexString() ?? '',
  telegramUserId: decodeValue(doc.telegramUserId),
  evmAddress: decodeValue(doc.evmAddress),
  solAddress: decodeValue(doc.solAddress),
  evmPrivateKey: decodeValue(doc.evmPrivateKey),
  solPrivateKey: decodeValue(doc.solPrivateKey),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const getWalletsCollection = async () => {
  const db = await getDb();
  return db.collection<WalletDoc>('user_wallets');
};

export const getWalletByTelegramUserId = async (telegramUserId: string) => {
  const collection = await getWalletsCollection();
  const doc = await collection.findOne({ telegramUserId: encodeValue(telegramUserId) });
  return doc ? mapToRecord(doc) : null;
};

export const getWalletById = async (id: string) => {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const collection = await getWalletsCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? mapToRecord(doc) : null;
};

export const createWallet = async (payload: {
  telegramUserId: string;
  evmAddress: string;
  solAddress: string;
  evmPrivateKey: string;
  solPrivateKey: string;
}) => {
  const now = new Date();
  const collection = await getWalletsCollection();
  const doc: WalletDoc = {
    telegramUserId: encodeValue(payload.telegramUserId),
    evmAddress: encodeValue(payload.evmAddress),
    solAddress: encodeValue(payload.solAddress),
    evmPrivateKey: encodeValue(payload.evmPrivateKey),
    solPrivateKey: encodeValue(payload.solPrivateKey),
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc);
  return mapToRecord({ ...doc, _id: result.insertedId });
};

type CounterDoc = {
  _id?: ObjectId;
  id: number;
  count: number;
  createdAt: Date;
  updatedAt: Date;
};

const getCounterCollection = async () => {
  const db = await getDb();
  return db.collection<CounterDoc>('counter');
};

export const getCounterById = async (id: number) => {
  const collection = await getCounterCollection();
  const doc = await collection.findOne({ id });
  return doc?.count ?? 0;
};

export const incrementCounter = async (id: number, increment: number) => {
  const now = new Date();
  const collection = await getCounterCollection();
  const result = await collection.findOneAndUpdate(
    { id },
    {
      $inc: { count: increment },
      $set: { updatedAt: now },
      $setOnInsert: { id, count: 0, createdAt: now },
    },
    { upsert: true, returnDocument: 'after' },
  );
  return result?.count ?? 0;
};

import {MongoClient} from 'mongodb'

const client = MongoClient.connect(process.env.TEST_MONGO_URL!, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

afterAll(async () => {
  const db = (await client).db()
  await db.dropDatabase()
})

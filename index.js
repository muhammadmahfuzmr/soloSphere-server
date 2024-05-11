const express = require('express');
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000 ;
const app = express()
const corsOptions = {
    origin: [
        'http://localhost:5173',  
    ],
    Credential: true,
    optionSucccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())

console.log(process.env.DB_USER)
console.log(process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.58gpv49.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // collection

    const jobsCollection = client.db('soloSphere').collection('jobs')
const bidCollection = client.db('soloSphere').collection('bids')
    //get all job data from database
app.get('/jobs', async (req, res)=>{
    const result = await jobsCollection.find().toArray()
    res.send(result)
})
    //get single job data from database


app.get('/jobs/:id', async(req, res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await jobsCollection.findOne(query)
    res.send(result)
})
// post bid api

app.post('/bid', async(req, res)=>{
    const bidData = req.body;
    const result = await bidCollection.insertOne(bidData)
    res.send(result)
})
// post job api
app.post('/job', async(req, res)=>{
    const jobData = req.body;
    const result = await jobsCollection.insertOne(jobData)
    res.send(result)
})
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    
  }
}
run().catch(console.dir);

app.get('/', (req, res)=>{
    res.send("Hello from solosphere server...")
})
app.listen(port, ()=>{
    console.log(`solosphere server is running on port: ${port}`)
})
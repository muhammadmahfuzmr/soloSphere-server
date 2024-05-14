const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

app.use(cookieParser());
//middleware

const verifyToken =(req, res, next)=>{
    const token = req.cookies.token;
    if(!token) return res.status(401).send({message: "unauthorized access"})
    if (token) {
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
         return res.status(401).send({message: "unauthorized access"})
        }
        console.log(decoded)
        req.user =decoded
        next()
      });
    }
    
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.58gpv49.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // collection

    const jobsCollection = client.db("soloSphere").collection("jobs");
    const bidCollection = client.db("soloSphere").collection("bids");
    //jwt token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });

      // res.cookie('token', token, {
      //     httpOnly:true,
      //     secure: process.env.NODE.ENV === 'production',
      //     sameSite: process.env.NODE.ENV === 'production' ? 'none' : 'strict'
      // }).send({success: true})
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });
    // clear token
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: true,
          sameSite: true,
          maxAge: 0,
        })
        .send({ success: true });
    });
    //get all job data from database
    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      res.send(result);
    });
    //get single job data from database

    app.get("/jobs/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    // get my posted data via email
    app.get("/mypostedjob/:email", verifyToken, async (req, res) => {
    const tokenEmail = req.user.email
      const email = req.params.email;
      if(tokenEmail !== email){
        return res.status(403).send({message: "forbidden access"})
      }
      const query = { "buyer.email": email };
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });

    // post bid api

    app.post("/bid", async (req, res) => {
      const bidData = req.body;
      const result = await bidCollection.insertOne(bidData);
      res.send(result);
    });
    // post job api
    app.post("/job", async (req, res) => {
      const jobData = req.body;
      const result = await jobsCollection.insertOne(jobData);
      res.send(result);
    });
    /// delete one job from db
    app.delete("/job/:id",  verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result);
    });
    // update job data
    app.put("/job/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const jobData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateJobData = {
        $set: {
          ...jobData,
        },
      };
      const result = await jobsCollection.updateOne(
        query,
        updateJobData,
        options
      );
      res.send(result);
    });

    // get bid api for spacific email

    app.get("/mybids/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await bidCollection.find(query).toArray();
      res.send(result);
    });
    //get bid api for buyer
    app.get("/bidrequests/:email",verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "buyer.email": email };
      const result = await bidCollection.find(query).toArray();
      res.send(result);
    });
    // update request bid api
    app.patch("/bid/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const query = { _id: new ObjectId(id) };
      const updateStatus = {
        $set: status,
      };
      const result = await bidCollection.updateOne(query, updateStatus);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from solosphere server...");
});
app.listen(port, () => {
  console.log(`solosphere server is running on port: ${port}`);
});

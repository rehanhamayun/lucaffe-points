// server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Replace 'YOUR_MONGODB_ATLAS_CONNECTION_STRING' with your actual MongoDB Atlas connection string
const atlasConnectionURI = 'mongodb+srv://lucaffe:mahmoud@lucaffe.yh1wwhp.mongodb.net/?retryWrites=true&w=majority';

// Connect to MongoDB Atlas
mongoose.connect(atlasConnectionURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Atlas Connected'))
  .catch(err => console.error('MongoDB Atlas Connection Error: ', err));

// Define a User schema and model
const UserSchema = new mongoose.Schema({
  name: String,
  phoneNumber: String,
  points: Number,
  orderValue: Number,
});

const User = mongoose.model('User', UserSchema);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-__v'); // Exclude __v field
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, phoneNumber, orderValue } = req.body;

    // Calculate the points based on the order value and conversion rate
    const points = Math.floor(orderValue / 100) * 5;

    const user = new User({
      name,
      phoneNumber,
      points,
      orderValue,
    });

    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//PUT NEW METHOD
// Define a custom PUT endpoint to update points by phone number
app.put('/api/users/points/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;
    const { points } = req.body; // Extract the 'points' value from the request body

    // Find the user by phone number and update the 'points' field
    const user = await User.findOneAndUpdate(
      { phoneNumber },
      { points },
      { new: true } // Return the updated user document
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




//GET
app.get('/api/users/points/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;
    const user = await User.findOne({ phoneNumber }).select('points');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ points: user.points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// specific endpoint for fetch

// Define a custom GET endpoint to retrieve points by phone number
app.get('/api/users/points/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;
    const user = await User.findOne({ phoneNumber }).select('points'); // Select only the 'points' field
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ points: user.points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put('/api/users/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.points = req.body.points;
    await user.save();
    const updatedUser = await User.findById(user._id).select('-__v'); // Exclude __v field
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//REDEEM POINTS 
// Define a custom PUT endpoint to redeem points by phone number
//PUT /api/users/redeem/123-456-7890

app.put('/api/users/redeem/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;
    const { redeemedPoints } = req.body; // Extract the 'redeemedPoints' value from the request body

    // Find the user by phone number
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure the user has enough points to redeem
    if (user.points < redeemedPoints) {
      return res.status(400).json({ message: 'Insufficient points to redeem' });
    }

    // Deduct the redeemed points from the user's total points
    user.points -= redeemedPoints;

    // Save the updated user document
    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/users/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.remove();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.json()); 


mongoose.connect('mongodb://localhost:27017/transactionDB');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));


const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  transaction_type: { type: String, enum: ['DEPOSIT', 'WITHDRAWAL'], required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  timestamp: { type: Date, default: Date.now },
});

const Transaction = mongoose.model('Transaction', transactionSchema);


app.post('/api/transactions', async (req, res) => {
  try {
    const { amount, transaction_type, user_id } = req.body;
    if (!amount || !transaction_type || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transaction = new Transaction({ amount, transaction_type, user_id });
    await transaction.save();

    return res.status(201).json(transaction);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


app.get('/api/transactions', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ error: 'Missing user_id query parameter' });
    }

    const transactions = await Transaction.find({ user_id });
    return res.status(200).json({ transactions });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


app.put('/api/transactions/:transaction_id', async (req, res) => {
  try {
    const { transaction_id } = req.params;
    const { status } = req.body;

    if (!['COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const transaction = await Transaction.findByIdAndUpdate(
      transaction_id,
      { status },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


app.get('/api/transactions/:transaction_id', async (req, res) => {
  try {
    const { transaction_id } = req.params;

    const transaction = await Transaction.findById(transaction_id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.status(200).json(transaction);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

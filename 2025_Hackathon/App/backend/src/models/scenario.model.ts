import mongoose from 'mongoose';


const scenarioSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['VR', 'web', 'mobile'],
    required: true,
  }
}, {
  timestamps: true,
});

export const ScenarioModel = mongoose.model('Scenario', scenarioSchema);

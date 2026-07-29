/**
 * src/roadmap/roadmap.model.js
 *
 * Stores each candidate's AI-generated career roadmap. Only two are ever
 * kept per user — `current` (the active one) and `previous` (the one it
 * replaced). Generating a new roadmap shifts current -> previous and the
 * old previous is discarded; there is no history beyond these two slots.
 */

const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title:       { type: String, default: '' },
  description: { type: String, default: '' },
}, { _id: false });

const ResourceSchema = new mongoose.Schema({
  type:   { type: String, default: '' }, // 'Book' | 'Course' | 'Documentation'
  title:  { type: String, default: '' },
  author: { type: String, default: '' },
}, { _id: false });

const PhaseSchema = new mongoose.Schema({
  id:             { type: Number, required: true },
  title:          { type: String, default: '' },
  subtitle:       { type: String, default: '' },
  description:    { type: String, default: '' },
  icon:           { type: String, default: '' }, // lucide icon name, e.g. 'code'
  color:          { type: String, default: '' }, // 'blue' | 'purple' | 'green' | 'orange'
  level:          { type: String, default: '' }, // Foundational | Intermediate | Advanced | Mastery
  estimatedHours: { type: Number, default: 0 },
  estimatedWeeks: { type: Number, default: 0 },
  topics:         { type: [String], default: [] },
  projects:       { type: [ProjectSchema], default: [] },
  skills:         { type: [String], default: [] },
  resources:      { type: [ResourceSchema], default: [] },
  outcome:        { type: String, default: '' },
}, { _id: false });

/* The full payload returned by the roadmap model, stored as-is. */
const RoadmapDataSchema = new mongoose.Schema({
  title:       { type: String, default: 'Career Roadmap' },
  targetRole:  { type: String, required: true },
  totalHours:  { type: Number, default: 0 },
  totalWeeks:  { type: Number, default: 0 },
  stats: {
    phases:     { type: Number, default: 4 },
    focusAreas: { type: Number, default: 0 },
    skills:     { type: Number, default: 0 },
  },
  phases:      { type: [PhaseSchema], default: [] },
  generatedAt: { type: Date, default: Date.now },
}, { _id: false });

const RoadmapSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
    },
    current:  { type: RoadmapDataSchema, default: null },
    previous: { type: RoadmapDataSchema, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Roadmap', RoadmapSchema);
/**
 * src/profile/profile.model.js
 *
 * Stores a candidate's full profile — one document per user.
 * Linked to User via userId (ObjectId ref).
 * File paths (photo, cert PDFs) are relative to the /uploads folder.
 */

const mongoose = require('mongoose');

/* ── Sub-schemas ─────────────────────────────────── */

const EducationSchema = new mongoose.Schema({
  institution: { type: String, default: '' },
  degree:      { type: String, default: '' },
  field:       { type: String, default: '' },
  location:    { type: String, default: '' },
  startDate:   { type: String, default: '' },
  endDate:     { type: String, default: '' },
  gpa:         { type: String, default: '' },
  coursework:  { type: String, default: '' },
}, { _id: false });

const ExperienceSchema = new mongoose.Schema({
  title:            { type: String, default: '' },
  company:          { type: String, default: '' },
  location:         { type: String, default: '' },
  startDate:        { type: String, default: '' },
  endDate:          { type: String, default: '' },
  current:          { type: Boolean, default: false },
  responsibilities: { type: String, default: '' },
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  name:      { type: String, default: '' },
  tech:      { type: String, default: '' },
  repo:      { type: String, default: '' },
  live:      { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate:   { type: String, default: '' },
  desc:      { type: String, default: '' },
}, { _id: false });

const CertSchema = new mongoose.Schema({
  name:       { type: String, default: '' },
  org:        { type: String, default: '' },
  issueDate:  { type: String, default: '' },
  credUrl:    { type: String, default: '' },
  certPdfUrl: { type: String, default: null }, // path to uploaded PDF
}, { _id: false });

const AwardSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  org:  { type: String, default: '' },
  year: { type: String, default: '' },
}, { _id: false });

const LeaderSchema = new mongoose.Schema({
  position: { type: String, default: '' },
  org:      { type: String, default: '' },
  duration: { type: String, default: '' },
  desc:     { type: String, default: '' },
}, { _id: false });

const VolunteerSchema = new mongoose.Schema({
  org:      { type: String, default: '' },
  role:     { type: String, default: '' },
  duration: { type: String, default: '' },
  desc:     { type: String, default: '' },
}, { _id: false });

const PubSchema = new mongoose.Schema({
  title:      { type: String, default: '' },
  conference: { type: String, default: '' },
  year:       { type: String, default: '' },
  link:       { type: String, default: '' },
}, { _id: false });

/* ── Root schema ─────────────────────────────────── */

const ProfileSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
    },

    /* ── Section enabled flags ── */
    secEnabled: {
      experience: { type: Boolean, default: true },
      certs:      { type: Boolean, default: true },
      awards:     { type: Boolean, default: true },
      leadership: { type: Boolean, default: true },
      volunteer:  { type: Boolean, default: true },
      pubs:       { type: Boolean, default: true },
      extras:     { type: Boolean, default: true },
    },

    /* ── Personal ── */
    personal: {
      fullName:  { type: String, default: '' },
      title:     { type: String, default: '' },
      email:     { type: String, default: '' },
      phone:     { type: String, default: '' },
      location:  { type: String, default: '' },
      portfolio: { type: String, default: '' },
      linkedin:  { type: String, default: '' },
      github:    { type: String, default: '' },
      summary:   { type: String, default: '' },
      photoUrl:  { type: String, default: null }, // path to uploaded photo
    },

    /* ── Sections ── */
    educations:  { type: [EducationSchema],  default: [] },
    experiences: { type: [ExperienceSchema], default: [] },
    projects:    { type: [ProjectSchema],    default: [] },

    skills: {
      languages:  { type: [String], default: [] },
      frameworks: { type: [String], default: [] },
      tools:      { type: [String], default: [] },
      libraries:  { type: [String], default: [] },
    },

    certs:      { type: [CertSchema],      default: [] },
    awards:     { type: [AwardSchema],     default: [] },
    leaders:    { type: [LeaderSchema],    default: [] },
    volunteers: { type: [VolunteerSchema], default: [] },
    pubs:       { type: [PubSchema],       default: [] },

    extras: {
      achievements: { type: String,   default: '' },
      interests:    { type: [String], default: [] },
    },

    /* ── Consent ── */
    consent: {
      storage:   { type: Boolean, default: false },
      recruiter: { type: Boolean, default: false },
    },

    /* ── GitHub repos cache ──
       Populated once on the first fetch (or via the dashboard's refresh
       button), then served straight from here on every subsequent load —
       that's what keeps every dashboard visit/sign-in from spending a
       GitHub API call. Only the refresh button ever hits GitHub again. */
    githubCache: {
      repos:     { type: [mongoose.Schema.Types.Mixed], default: [] },
      fetchedAt: { type: Date, default: null },
    },

    /* ── Completion ── */
    isComplete:     { type: Boolean, default: false },
    lastAutosavedAt: { type: Date,   default: null  },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', ProfileSchema);
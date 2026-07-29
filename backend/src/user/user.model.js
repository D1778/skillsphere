const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, unique: true, sparse: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    role:        { type: String, enum: ['candidate','company'], required: true, default: 'candidate' },
    fullName:    { type: String, trim: true },
    companyName: { type: String, trim: true },
    photoURL:    { type: String, default: null },
    provider:    { type: String, enum: ['email','google','github'], default: 'email' },
    isVerified:  { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    refreshToken:        { type: String, default: null },
    clerkEmailAddressId: { type: String, default: null },
    lastLoginAt:         { type: Date,   default: null },

    /* ── Company social links — signup never collects these, so they
       start empty and the company fills them in later from the
       Company Profile page's Social Links section. ── */
    socialLinks: {
      linkedin: { type: String, default: '' },
      twitter:  { type: String, default: '' },
    },

    /* ── NEW: gates routing after signup ── */
    profileCompleted: { type: Boolean, default: false },

    /* ── Candidate: bookmarked job postings ──
       Previously this only lived in JobsPage's local React state, so it
       reset on every refresh. Persisting it on the user doc means it
       survives reloads/sign-outs and is easy to populate() alongside
       the rest of the account. ── */
    bookmarkedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: [] }],

    /* ── Company: cached AI-recommended-candidates for the dashboard ──
       Gemini's free tier has a small daily/per-minute request quota, and
       the dashboard is a page people reload constantly — calling the
       model on every load would burn through that quota almost
       immediately. Instead we cache the ranked picks here and only call
       Gemini again once the cache is older than the configured TTL (see
       dashboard.service.js). Each pick remembers which of the company's
       jobs it was matched against, since the same candidate might have
       applied to more than one. ── */
    dashboardRecommendationCache: {
      generatedAt: { type: Date, default: null },
      picks: [
        {
          _id:          false,
          candidateId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          jobId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
          matchPercent: { type: Number, default: null },
          reason:       { type: String, default: '' },
        },
      ],
    },
  },
  { timestamps: true }
);

UserSchema.virtual('displayName').get(function () {
  return this.role === 'company' ? this.companyName : this.fullName;
});

UserSchema.methods.toPublic = function () {
  return {
    id:               this._id,
    email:            this.email,
    role:             this.role,
    displayName:      this.role === 'company' ? this.companyName : this.fullName,
    photoURL:         this.photoURL,
    isVerified:       this.isVerified,
    provider:         this.provider,
    socialLinks:      this.socialLinks,
    profileCompleted: this.profileCompleted,   // ← frontend needs this for routing
    bookmarkedJobIds: (this.bookmarkedJobs || []).map((id) => String(id)),
    createdAt:        this.createdAt,
    lastLoginAt:      this.lastLoginAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
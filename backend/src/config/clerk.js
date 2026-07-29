/**
 * src/config/clerk.js
 *
 * Initialises the Clerk Backend API client using @clerk/backend.
 * This is the ONLY place in the codebase that touches Clerk credentials.
 *
 * Package: @clerk/backend  (the modern replacement for @clerk/clerk-sdk-node
 *          which was deprecated January 10, 2025)
 *
 * Exposes clerkClient which gives access to:
 *   clerkClient.users.*          — user management
 *   clerkClient.emailAddresses.* — email CRUD + OTP verification
 */

// const { createClerkClient } = require('@clerk/backend');

// const clerkClient = createClerkClient({
//   secretKey: process.env.CLERK_SECRET_KEY,
// });

// module.exports = clerkClient;
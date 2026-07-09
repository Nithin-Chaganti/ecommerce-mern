/**
 * ApiResponse
 * ----------------------------------------------------------------------------
 * Purpose: A single, consistent SUCCESS response shape, mirroring ApiError's
 *          role for failures. Every successful controller response should
 *          use this so the frontend can always expect the same envelope:
 *
 *          { success: true, statusCode, message, data }
 *
 * Why this matters (interview-relevant):
 * Consistent response envelopes mean the frontend's Axios interceptor
 * (built in Phase 11) can handle ALL responses generically, instead of
 * every page needing to know the specific shape of every endpoint.
 */

class ApiResponse {
  constructor(statusCode, data = null, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

module.exports = ApiResponse;
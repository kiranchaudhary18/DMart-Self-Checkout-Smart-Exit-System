/**
 * Centralized API Error Handler
 * Parses an Axios error object and returns a safe, user-friendly error string.
 * It strictly avoids exposing internal stack traces, JWTs, or raw database exceptions.
 */
export function handleApiError(error: any): string {
  // Check if it's a standard Axios error response
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // Prioritize safe, explicit message from backend if available
    // e.g. {"message": "Invalid Coupon Code"}
    if (data && typeof data.message === "string" && data.message.trim() !== "") {
        // Basic check to ensure we aren't displaying a raw DB stack trace
        if (!data.message.toLowerCase().includes("traceback") && !data.message.toLowerCase().includes("sql")) {
            return data.message;
        }
    }

    // Fallback to standard HTTP status mapping
    switch (status) {
      case 400:
        return "Invalid input. Please check your details.";
      case 401:
        return "Your session has expired. Please log in again.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "Conflict: This record may already exist.";
      case 429:
        return "Too many requests. Please slow down.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "Something went wrong on our end. Please try again later.";
      default:
        return "An unexpected error occurred.";
    }
  } else if (error.request) {
    // The request was made but no response was received
    return "Network error. Please check your connection.";
  } else {
    // Something happened in setting up the request that triggered an Error
    return "Failed to process the request.";
  }
}

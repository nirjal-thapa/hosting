const API_URL = "http://localhost:8000";

// Turn a stored path like "/uploads/123.jpg" into a full URL
export const imageUrl = (path) => (path ? `${API_URL}${path}` : null);

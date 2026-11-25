// Pictures are stored as "/uploads/123.jpg" and the backend serves them under /api,
// so the picture's address is "/api/uploads/123.jpg".
export const imageUrl = (path) => (path ? `/api${path}` : null);

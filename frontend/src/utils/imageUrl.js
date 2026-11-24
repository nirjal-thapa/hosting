// Pictures are served by the backend at /uploads/... on the same address as the site,
// so the stored path (e.g. "/uploads/123.jpg") can be used as-is.
export const imageUrl = (path) => path || null;

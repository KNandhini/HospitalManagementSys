// src/utils/getErrorMessage.js
export function getErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data?.title) return err.response.data.title; // ASP.NET ProblemDetails shape
  if (err?.message) return err.message;
  return fallback;
}
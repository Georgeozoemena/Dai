const API_URL = "http://localhost:5000";

export async function authenticateWithGoogle(
  idToken: string,
) {
  const response = await fetch(
    `${API_URL}/api/auth/google`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Authentication failed",
    );
  }

  return data;
}
import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library";
// import fetch from "node-fetch"; // For fetching user data from Google

dotenv.config();

const getGoogleLoginUrl = asyncHandler(async (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Referrer-Policy", "no-referrer-when-downgrade");

  const redirectURL = "http://localhost:7002/api/user/google/callback";
  const oAuth2Client = new OAuth2Client(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    redirectURL
  );

  // Generate the URL for Google's OAuth2 consent dialog
  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: "https://www.googleapis.com/auth/userinfo.profile openid",
    prompt: "consent",
  });

  // Send the generated URL to the client
  res.json({ url: authorizeUrl });
});

// Function to get user data from Google using the access token
const getUserData = async (access_token) => {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
  );
  const data = await response.json();
  console.log("User Data:", data);
  return data;
};

/*
// Function to handle OAuth2 callback and exchange code for tokens
const handleOAuthCallback = asyncHandler(async (req, res, next) => {
  const code = req.query.code;

  try {
    const redirectURL = "http://localhost:7002/api/user/google/callback";
    const oAuth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      redirectURL
    );

    // Exchange the code for tokens
    const r = oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(r.tokens); // Set the credentials on the client
    console.info("Tokens acquired:", r.tokens);

    // Fetch user data
    const user = await getUserData(oAuth2Client.credentials.access_token);
    console.log("OAuth2 User Data:", user);

    // Redirect to the frontend or handle the user data as needed
    res.redirect(303, "http://localhost:3000/");
  } catch (err) {
    console.error("Error during OAuth2 callback:", err);
    res
      .status(500)
      .json({ message: "OAuth2 login failed", error: err.message });
  }
});
*/

const handleOAuthCallback = asyncHandler(async (req, res, next) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ message: "Missing authorization code." });
  }

  try {
    const redirectURL = "http://localhost:7002/api/user/google/callback";
    const oAuth2Client = new OAuth2Client(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      redirectURL
    );

    // Exchange the code for tokens
    const { tokens } = await oAuth2Client.getToken(code); // Await the promise
    oAuth2Client.setCredentials(tokens); // Set the credentials on the client
    console.info("Tokens acquired:", tokens);

    // Ensure the access token exists
    if (!tokens.access_token) {
      throw new Error("Access token not found in the token response.");
    }

    // Fetch user data
    const user = await getUserData(tokens.access_token); // Use tokens.access_token directly
    console.log("OAuth2 User Data:", user);

    // Redirect to the frontend or handle the user data as needed
    res.redirect(303, "http://localhost:3000/");
  } catch (err) {
    console.error("Error during OAuth2 callback:", err);
    res.status(500).json({ message: "OAuth2 login failed", error: err.message });
  }
});


export default { getGoogleLoginUrl, handleOAuthCallback};

// index.js

// 1. Import Dependencies
require('dotenv').config();
const express = require('express');
const axios = require('axios');

// 2. Initialize Express App
const app = express();
app.use(express.json()); // Crucial: enables the app to read JSON from request bodies

// 3. Load Environment Variables
const port = process.env.PORT || 3000;
const apiUrl = process.env.API_URL;
const apiUser = process.env.API_BASIC_AUTH_USER;
const apiPass = process.env.API_BASIC_AUTH_PASS;
const apiUsernameField = process.env.API_USERNAME_FIELD;
const defaultDate = process.env.API_DEFAULT_DATE;

// 4. Create the API Proxy Endpoint
app.post('/api/proxy', async (req, res) => {
  console.log(`Received proxy request at ${new Date().toISOString()}`);

  // Validate that essential server variables are loaded
  if (!apiUrl || !apiUser || !apiPass || !apiUsernameField) {
    return res.status(500).json({ message: "Server configuration error: Missing API environment variables." });
  }

  // Use the date from the user's request body, or fallback to the default from .env
  const requestDate = req.body.date || defaultDate;
  if (!requestDate) {
    return res.status(400).json({ message: "Missing 'date' in request body and no default is set." });
  }
  
  // 5. Construct the Request Body for the external API
  const requestBody = {
    "Date": requestDate,
    "SchdRevNo": -1,
    "UserName": apiUsernameField,
    "UtilAcronymList": [],
    "UtilRegionIdList": []
  };

  // 6. Configure the Axios request, including Basic Auth
  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json'
    },
    // Axios handles the Base64 encoding for Basic Auth automatically
    auth: {
      username: apiUser,
      password: apiPass
    }
  };

  try {
    console.log("Calling external API with body:", requestBody);
    
    // 7. Make the POST request to the external API
    const externalApiResponse = await axios.post(apiUrl, requestBody, axiosConfig);

    console.log("Successfully fetched data from external API.");
    res.status(externalApiResponse.status).json(externalApiResponse.data);

  } catch (error) {
    console.error("Error calling the external API:", error.message);
    if (error.response) {
      // Forward the error from the external API
      res.status(error.response.status).json({
        message: "Error from external API.",
        details: error.response.data
      });
    } else {
      res.status(500).json({ message: "An internal server error occurred." });
    }
  }
});

// 8. Start the Server
app.listen(port, () => {
  console.log(`✅ Proxy server is running on http://localhost:${port}`);
  console.log(`Listening for POST requests on /api/proxy`);
});
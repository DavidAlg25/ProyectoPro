/**
*Author: 	DIEGO CASALLAS
*Date:		01/01/2026  
*Description:	Controller for user-related API operations - NODEJS
**/
import UserApiModel from '../models/userApi.model.js';
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// Load environment variables from the .env file
dotenv.config();

/**
 * The function `showApiUser` fetches user data using an instance of `UserApiModel` and handles errors
 * by sending a 500 status response with an error message.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request made by the client, such as headers, parameters, and
 * body data. In this context, it is being passed to the `showApiUser` function to handle the API
 * request.
 * @param res - The `res` parameter in the `showApiUser` function is the response object that will be
 * used to send a response back to the client making the request. It is typically used to send HTTP
 * responses with data or error messages.
 */
export const showApiUser = async (req, res) => {
  try {
    const userApiModel = new UserApiModel();
    userApiModel.showApiUser(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users", details: error.message });
  }
};

/**
 * The function `showApiUserId` fetches a user's ID using an instance of `UserApiModel` and handles any
 * errors that occur.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body content, and more. In this context, `req` is being passed to the `showApiUserId`
 * function to retrieve user
 * @param res - The `res` parameter in the `showApiUserId` function is typically the response object in
 * Node.js Express framework. It is used to send a response back to the client making the request.
 */
export const showApiUserId = async (req, res) => {
  try {
    const userApiModel = new UserApiModel();
    userApiModel.showApiUserId(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user", details: error.message });
  }
};

/**
 * The function addApiUser asynchronously adds a user using a UserApiModel instance and handles any
 * errors by sending a 500 status response with an error message.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body content, and more. In this context, `req` is being passed to the `addApiUser`
 * function to provide necessary
 * @param res - The `res` parameter in the `addApiUser` function is typically used to send a response
 * back to the client making the API request. It is an instance of the response object in Express.js,
 * which allows you to send HTTP responses with data or status codes. In this context, `res
 */
export const addApiUser = async (req, res) => {
  try {
    const userApiModel = new UserApiModel();
    userApiModel.addApiUser(req, res);

  } catch (error) {
    res.status(500).json({ error: "Error adding user", details: error.message });
  }
};

/**
 * The function `updateApiUser` updates a user using a UserApiModel instance and handles errors by
 * sending a 500 status response with details.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body content, and more. In this context, `req` is likely being used to pass the request
 * object to the `updateApi
 * @param res - The `res` parameter in the `updateApiUser` function is typically used to send a
 * response back to the client making the request. It is an instance of the response object in
 * Express.js, which allows you to send HTTP responses with data or status codes. In this case, the
 * `res
 */
export const updateApiUser = async (req, res) => {
  try {
    const userApiModel = new UserApiModel();
    userApiModel.updateApiUser(req, res);
    
  } catch (error) {
    res.status(500).json({ error: "Error updating user", details: error.message });
  }
};

/**
 * The function deleteApiUser deletes a user using the UserApiModel class and handles errors by sending
 * a 500 status with an error message.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body content, and more. In this context, `req` is likely an object containing data
 * related to the request to delete a user
 * @param res - The `res` parameter in the `deleteApiUser` function is typically used to send a
 * response back to the client making the request. It is an instance of the response object in
 * Express.js, which allows you to send HTTP responses with data or status codes. In this context,
 * `res`
 */
export const deleteApiUser = async (req, res) => {
  try {
    const userApiModel = new UserApiModel();
    userApiModel.deleteApiUser(req, res); 

  } catch (error) {
    res.status(500).json({ error: "Error deleting user", details: error.message });
  }
};

/**
 * The function `loginApiUser` is an asynchronous function that handles logging in a user through an
 * API call.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body content, and more. In this context, `req` is likely being used to pass the request
 * object to the `loginApi
 * @param res - The `res` parameter in the `loginApiUser` function is typically used to send a response
 * back to the client making the request. It is an instance of the response object in Express.js, which
 * allows you to send data, set headers, and manage the response to the client.
 */
export const loginApiUser = async (req, res) => {
  try {
    const userApiModel = new UserApiModel();
    userApiModel.loginApiUser(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error logging in user", details: error.message });
  }
};

/**
 * The function `verifyTokenLogin` verifies a token for user authentication and returns a response
 * based on the token's validity.
 * @param req - The `req` parameter in the `verifyTokenLogin` function stands for the request object.
 * It contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body, and more. In this case, the function is extracting the token from the request body
 * or query parameters to
 * @param res - The `res` parameter in the `verifyTokenLogin` function is the response object that is
 * used to send a response back to the client making the request. It is typically used to send HTTP
 * responses with status codes, headers, and data back to the client. In the provided code snippet, `
 * @returns If the token is valid, the function will return a status of 200 with a JSON response
 * containing a message "Token is valid" and the user object that was decoded from the token. If the
 * token is invalid or there is an error during verification, the function will return a status of 400
 * with a JSON response containing an error message "Invalid Token".
 */
export const verifyTokenLogin = (req, res) => {
  const token = req.body.token || req.query.token ;
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    //See data token encrypted
    //console.log(verified);
    res.status(200).json({ message: "Token is valid", user: verified });
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
};



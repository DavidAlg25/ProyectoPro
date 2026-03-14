/**
*Author: 	DIEGO CASALLAS
*Date:		01/01/2026  
*Description:	Controller for user-related operations - NODEJS
**/
import UserModel from '../models/user.model.js';


/**
 * The function `showUser` fetches user data using an instance of `UserModel` and sends the response to
 * the client.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body content, and more. In this context, it is likely used to pass the request details
 * to the `showUser` function.
 * @param res - The `res` parameter in the `showUser` function is typically used to send a response
 * back to the client making the request. It is an instance of the response object in Express.js, which
 * allows you to send data, set headers, and manage the response to the client's request. In
 */
export const showUser = async (req, res) => {
  try {
    const userInstance = new UserModel();
    userInstance.showUser(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users", details: error.message });
  }
};

/**
 * The function `showUserId` fetches a user by their ID and sends the response.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body, and more. In this context, `req` is likely an Express request object that is being
 * passed to the `showUserId
 * @param res - The `res` parameter in the `showUserId` function is typically the response object in an
 * Express.js route handler. It is used to send a response back to the client making the request.
 */
export const showUserId = async (req, res) => {
  try {
    const userInstance = new UserModel();
    userInstance.showUserById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user", details: error.message });
  }
};

/**
 * The function `addUser` creates a new user instance and adds a user using the UserModel class,
 * handling any errors that may occur.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body content, and more. In this context, it is being used as an argument in the
 * `addUser` function call to pass
 * @param res - The `res` parameter in the `addUser` function is typically used to send a response back
 * to the client making the request. It is an object representing the HTTP response that the server
 * sends when it receives an HTTP request. In this context, `res` is used to handle the response for
 */
export const addUser = async (req, res) => {
  try {
    const userInstance = new UserModel();
    userInstance.addUser(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding user", details: error.message });
  }
};

/**
 * The function `updateUser` updates a user instance using data from the request and response objects,
 * handling errors if they occur.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body content, and more. In this context, `req` is likely being used to pass the request
 * object to the `updateUser
 * @param res - The `res` parameter in the `updateUser` function is typically used to send a response
 * back to the client making the request. It is an object that represents the HTTP response that an
 * Express.js route sends when it gets an HTTP request. You can use methods like `res.status()` to set
 */
export const updateUser = async (req, res) => {
  try {
    const userInstance = new UserModel();
    userInstance.updateUser(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating user", details: error.message });
  }
};

/**
 * The function deleteUser asynchronously deletes a user using UserModel and handles any errors that
 * occur.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function. This object includes
 * properties such as headers, parameters, body, and more, depending on the type of request being made.
 * In this context, `req` is likely
 * @param res - The `res` parameter in the `deleteUser` function is typically used to send a response
 * back to the client making the request. It is an instance of the response object in Express.js, which
 * allows you to send HTTP responses with data or status codes. In this context, `res` is
 */
export const deleteUser = async (req, res) => {
  try {
    const userInstance = new UserModel();
    userInstance.deleteUser(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting user", details: error.message });
  }
};



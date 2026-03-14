/**
*Author: 	DIEGO CASALLAS
*Date:		01/01/2026  
*Description:	Controller for role-related API operations - NODEJS
**/

import RoleModel from '../models/role.model.js';

/**
 * The function `showRole` fetches and displays roles, handling any errors that may occur.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body, and more. In this context, it is likely used to pass the request object to the
 * `showRole` function for processing
 * @param res - The `res` parameter in the `showRole` function is typically the response object in an
 * Express route handler. It is used to send a response back to the client making the request. In this
 * case, it is being used to send a JSON response with an error message if there is an error
 */
export const showRole = async (req, res) => {
  try {
    const roleModel = new RoleModel();
    roleModel.showRole(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Roles", details: error.message });
  }
};

/**
 * The function `showRoleId` fetches a role by its ID and handles any errors that occur during the
 * process.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function, such as headers,
 * parameters, body content, and more. In this context, `req` is likely being used to pass the request
 * object to the `showRoleId
 * @param res - The `res` parameter in the `showRoleId` function is typically the response object in an
 * Express route handler. It is used to send a response back to the client making the request.
 */
export const showRoleId = async (req, res) => {
  try {
    const roleModel = new RoleModel();
    roleModel.showRoleById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching Role", details: error.message });
  }
};

/**
 * The function `addRole` creates a new RoleModel instance and calls the `addRole` method on it with
 * the provided request and response objects, handling any errors that occur.
 * @param req - The `req` parameter typically represents the request object in an Express.js
 * application. It contains information about the HTTP request that triggered the function, such as
 * headers, parameters, body, and query parameters. In this context, it is being passed to the
 * `addRole` function to provide necessary data for
 * @param res - The `res` parameter in the `addRole` function is typically used to send a response back
 * to the client making the request. It is an object that represents the HTTP response that an
 * Express.js route sends when it gets an HTTP request. You can use methods on this object, such as `
 */
export const addRole = async (req, res) => {
  try {
    const roleModel = new RoleModel();
    roleModel.addRole(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding Role", details: error.message });
  }
};

/**
 * The function `updateRole` updates a role using a RoleModel instance and handles errors by sending a
 * 500 status response with an error message.
 * @param req - The `req` parameter typically represents the request object in an Express.js
 * application. It contains information about the HTTP request that triggered the function. This object
 * includes properties such as headers, parameters, query strings, and the request body.
 * @param res - The `res` parameter in the `updateRole` function is typically the response object in
 * Node.js, which is used to send a response back to the client making the request. It contains methods
 * and properties that allow you to control what data is sent back to the client, such as setting the
 * status
 */

export const updateRole = async (req, res) => {
  try {
    const roleModel = new RoleModel();
    roleModel.updateRole(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating Role", details: error.message });
  }
};

/**
 * The function `deleteRole` attempts to delete a role using a RoleModel instance and handles any
 * errors that occur.
 * @param req - The `req` parameter typically represents the request object in Node.js applications. It
 * contains information about the HTTP request that triggered the function. This object includes
 * properties such as headers, parameters, body, and more, depending on the type of request being made.
 * @param res - The `res` parameter in the `deleteRole` function is typically the response object in an
 * Express.js route handler. It is used to send a response back to the client making the request.
 */
export const deleteRole = async (req, res) => {
  try {
    const roleModel = new RoleModel();
    roleModel.deleteRRole(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting Role", details: error.message });
  }
};



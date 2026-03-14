
/**
*Author: 	DIEGO CASALLAS
*Date:		01/01/2026  
*Description:	This code defines a `UserApiModel` class that provides methods for managing API users in a database. The class includes methods for showing all users, showing a user by ID, adding a new user, updating an existing user, deleting a user, and logging in a user. Each method interacts with the database using SQL queries and handles errors appropriately, returning JSON responses with relevant status codes and messages. The `loginApiUser` method also generates a JSON Web Token (JWT) for authenticated users, which can be used for subsequent requests to protected routes.
**/
import { connect } from '../config/db/connect.js';
import { encryptPassword, comparePassword } from '../library/appBcrypt.js';
import jwt from "jsonwebtoken";

class UserApiModel {
  constructor(id, user, password, status, role) {
    this.id = id;
    this.user = user;
    this.password = password;
    this.status = status;
    this.role = role;
  }

  /* The `showApiUser` method in the `UserApiModel` class is an asynchronous function that fetches all
  users from the database. Here's a breakdown of what it does: */
  async showApiUser(req, res) {
    try {
      let sqlQuery = "SELECT * FROM api_users";
      const [result] = await connect.query(sqlQuery);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: "Error fetching users", details: error.message });
    }
  };

  /* The `showApiUserId` method in the `UserApiModel` class is an asynchronous function that fetches a
  specific user from the database based on the provided user ID. Here's a breakdown of what it does: */
  async showApiUserId(req, res) {
    try {
      const [result] = await connect.query('SELECT * FROM api_users WHERE Api_user_id= ?', [req.params.id]);
      if (result.length === 0) return res.status(404).json({ error: "user not found" });
      res.status(200).json(result[0]);
    } catch (error) {
      res.status(500).json({ error: "Error fetching user", details: error.message });
    }
  };

  /* The `addApiUser` method in the `UserApiModel` class is an asynchronous function that handles the
  addition of a new user to the database. Here's a breakdown of what it does: */
  async addApiUser(req, res) {
    try {
      const { user, password, status, role } = req.body;
      if (!user || !password || !status || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const hashedPassword = await encryptPassword(password);
      let sqlQuery = "INSERT INTO api_users(Api_user,Api_password,Api_status,Api_role) VALUES (?,?,?,?)";
      const [result] = await connect.query(sqlQuery, [user, hashedPassword, status, role]);
      res.status(201).json({
        data: [{ id: result.insertId, user, hashedPassword, status, role }],
        status: 201
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding user", details: error.message });
    }
  };

  /* The `updateApiUser` method in the `UserApiModel` class is an asynchronous function that handles
  updating an existing user in the database. Here's a breakdown of what it does: */
  async updateApiUser(req, res) {
    try {
      const { user, password, role, status } = req.body;
      if (!user || !password || !status || !role) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      let sqlQuery = "UPDATE  api_users SET Api_user=?,Api_password=?,Api_role =?,Api_status=?,Updated_at=? WHERE Api_user_id= ?";
      const updated_at = new Date().toLocaleString("en-CA", { timeZone: "America/Bogota" }).replace(",", "").replace("/", "-").replace("/", "-");
      const [result] = await connect.query(sqlQuery, [user, password, role, status, updated_at, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "user not found" });
      res.status(200).json({
        data: [{ user, status, role, updated_at }],
        status: 200,
        updated: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error updating user", details: error.message });
    }
  };

  /* The `deleteApiUser` method in the `UserApiModel` class is an asynchronous function that handles
  the deletion of a user from the database based on the provided user ID. Here's a breakdown of what
  it does: */
  async deleteApiUser(req, res) {
    try {
      let sqlQuery = "DELETE FROM api_users WHERE Api_user_id = ?";
      const [result] = await connect.query(sqlQuery, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "user not found" });
      res.status(200).json({
        data: [],
        status: 200,
        deleted: result.affectedRows
      });
    } catch (error) {
      res.status(500).json({ error: "Error deleting user", details: error.message });
    }
  };

  /**
   * The function `loginApiUser` is an asynchronous function that handles user authentication by checking
   * the API user credentials, generating a JWT token upon successful authentication, and returning the
   * token in the response.
   * @param req - The `req` parameter in the `loginApiUser` function represents the request object, which
   * contains information about the HTTP request made to the server. This object includes properties such
   * as headers, body, parameters, query strings, and more, depending on the type of request.
   * @param res - The `res` parameter in the `loginApiUser` function is typically the response object in
   * Node.js Express framework. It is used to send a response back to the client making the request. In
   * this function, `res` is used to send JSON responses with status codes and data back to the
   * @returns The `loginApiUser` function is returning a JSON response with a token if the login is
   * successful. If the user is not found or the password is incorrect, it will return an error message
   * in the JSON response. If there is an error during the process, it will return a 500 status with an
   * error message and details.
   */
  async loginApiUser(req, res) {
    try {
      const { api_user, api_password } = req.body;
      let sqlQuery = "SELECT * FROM api_users WHERE Api_user= ?";
      const [result] = await connect.query(sqlQuery, api_user);
      //await connect.end();
      if (result.length === 0) return res.status(400).json({ error: "user not found" });
      const user = result[0];
      const validPassword = await comparePassword(api_password, user.Api_password);
      if (!validPassword) return res.status(400).json({ error: "Incorrect password" });
      const token = jwt.sign({ id: user.Api_user_id, role: user.Api_role, status: user.Api_status }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({ token });
    } catch (error) {
      res.status(500).json({ error: "Error deleting user", details: error.message });
    }
  }

};
export default UserApiModel;
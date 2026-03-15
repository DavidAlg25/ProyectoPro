import UserAuthorityModel from '../models/UserAuthority.model.js';

export const showUserAuthority = async (req, res) => {
  try {
    const userAuthorityModel = new UserAuthorityModel();
    userAuthorityModel.showUserAuthority(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching UserAuthoritys", details: error.message });
  }
};

export const showUserAuthorityId = async (req, res) => {
  try {
    const userAuthorityModel = new UserAuthorityModel();
    userAuthorityModel.showUserAuthorityById(res, req);
  } catch (error) {
    res.status(500).json({ error: "Error fetching UserAuthority", details: error.message });
  }
};

export const addUserAuthority = async (req, res) => {
  try {
    const userAuthorityModel = new UserAuthorityModel();
    userAuthorityModel.addUserAuthority(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error adding UserAuthority", details: error.message });
  }
};

export const updateUserAuthority = async (req, res) => {
  try {
    const userAuthorityModel = new UserAuthorityModel();
    userAuthorityModel.updateUserAuthority(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error updating UserAuthority", details: error.message });
  }
};

export const deleteUserAuthority = async (req, res) => {
  try {
    const userAuthorityModel = new UserAuthorityModel();
    userAuthorityModel.deleteUserAuthority(req, res);
  } catch (error) {
    res.status(500).json({ error: "Error deleting UserAuthority", details: error.message });
  }
};



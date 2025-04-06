const express = require("express");
const { getUsers, updateUser, deleteUser } = require("../controllers/AdminController"); // ✅ Fixed case-sensitive import

const router = express.Router();

// Route to get all users (only typeUser: "user")
router.get("/users", getUsers);

// Route to update a user by ID
router.put("/users/:id", updateUser);

// Route to delete a user by ID
router.delete("/users/:id", deleteUser);

module.exports = router;
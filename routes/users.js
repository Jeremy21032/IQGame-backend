const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const path = require("path");
const pool = require("../db");
const crypto = require("crypto");
const fs = require("fs");
const multer = require("multer");
const sendResetEmail = require("./resetPassword");
const cloudinary = require("../config/cloudinaryConfig");

// Ruta para registro de usuarios
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Please provide a username, email, and password.",
      isAuthenticated: false,
    });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.execute(
      `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
      [username, email, hashedPassword]
    );

    if (result[0].affectedRows > 0) {
      const user = await loginUser(username, password);
      res.status(201).json({
        message: "User registered successfully!",
        user: user,
        isAuthenticated: true,
      });
    } else {
      res
        .status(400)
        .json({
          message: "User not registered!",
          user: null,
          isAuthenticated: false,
        });
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res
      .status(500)
      .json({ message: "Error registering user", isAuthenticated: false });
  }
});

const loginUser = async (username, password) => {
  const [users] = await pool.execute(`SELECT * FROM users WHERE username = ?`, [
    username,
  ]);
  if (users.length === 0) {
    return { message: "Invalid username or password", isAuthenticated: false };
  }

  const user = users[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return { message: "Invalid username or password", isAuthenticated: false };
  }
  return user;
};

// Ruta para inicio de sesión de usuarios
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || Object.keys(req.body).length !== 2) {
    return res.status(400).json({
      message: "Bad Request: Invalid payload",
      isAuthenticated: false,
    });
  }
  try {
    const user = await loginUser(username, password);
    if (user.isAuthenticated === false) {
      return res.status(401).json(user);
    }
    res.json({
      message: "Login successful",
      user: user,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in" });
  }
});

// Ruta para actualizar el perfil del usuario
router.post("/update-profile", async (req, res) => {
  const { name, lastname, user_id, profileImage } = req.body;

  if (!name || !lastname || !user_id) {
    return res.status(400).json({ message: "Bad Request: Invalid payload" });
  }

  try {
    let imageUrl = profileImage;

    if (profileImage) {
      const uploadResponse = await cloudinary.uploader.upload(profileImage, {
        folder: "profile_images",
      });
      imageUrl = uploadResponse.secure_url;
    }

    await pool.execute(
      "UPDATE users SET user_firstName=?, user_lastName=?, user_image=? WHERE user_id=?",
      [name, lastname, imageUrl, user_id]
    );
    res.status(200).send({
      message: "Profile updated successfully",
      profileImageUrl: imageUrl,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// Ruta para restablecer la contraseña
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE resetPasswordToken=? AND resetPasswordExpires > NOW()`,
      [token]
    );

    if (rows.length > 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await pool.execute(
        `UPDATE users SET password_hash=?, resetPasswordToken=NULL, resetPasswordExpires=NULL WHERE user_id=?`,
        [hashedPassword, rows[0].user_id]
      );

      res.status(200).send("Password has been successfully reset.");
    } else {
      res.status(400).send("Password reset token is invalid or has expired.");
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send("Error resetting password");
  }
});

// Ruta para solicitar el restablecimiento de la contraseña
router.post("/request-reset", async (req, res) => {
  const { email } = req.body;
  const token = crypto.randomBytes(5).toString("hex");

  try {
    await pool.execute(
      `UPDATE users SET resetPasswordToken=?, resetPasswordExpires=DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE email=?`,
      [token, email]
    );

    await sendResetEmail(email, token);

    res.status(200).send({
      isAuthenticated: true,
      message: "Reset password link has been sent to your email.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res
      .status(500)
      .send({ isAuthenticated: false, message: "Error resetting password" });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const path = require('path');
const pool = require('../db');
const crypto = require('crypto');
const fs = require('fs');
const multer = require('multer');
const sendResetEmail = require('./resetPassword');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });



// Ruta para registro de usuarios
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide a username, email, and password.',isAuthenticated:false });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
    
        const result = await pool.execute(
            `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
            [username, email, hashedPassword]
        );
        console.log(result);  // Verificar qué está devolviendo realmente
    
        const [rows, fields] = result;
        res.status(201).json({ message: 'User registered successfully!', userId: rows.insertId ,isAuthenticated:true});
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' ,isAuthenticated:false});
    }
    
});

// Ruta para inicio de sesión de usuarios
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || Object.keys(req.body).length !== 2) {
      return res.status(400).json({ message: 'Bad Request: Invalid payload',isAuthenticated:false });
    }
    try {
        const [users] = await pool.execute(
            `SELECT * FROM users WHERE username = ?`,
            [username]
        );
        console.log(users);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' ,isAuthenticated:false});
        }

        const user = users[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid username or password',isAuthenticated:false });
        }

        res.json({ message: 'Login successful', user: user , isAuthenticated:true});
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});
// Ruta para actualizar el perfil del usuario
router.post('/update-profile', upload.single('profileImage'), async (req, res) => {
  const { name, lastname, user_id } = req.body;
  const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !lastname || !user_id || !profileImage) {
    return res.status(400).json({ message: 'Bad Request: Invalid payload' });
  }

  try {
    await pool.execute(
      `UPDATE users SET user_firstName=?, user_lastName=?, user_image=? WHERE user_id=?`,
      [name, lastname, profileImage, user_id]
    );
    res.status(200).send({ message: 'Profile updated successfully', profileImageUrl: profileImage });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});


router.post('/reset-password/:token', async (req, res) => {
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
  
        res.status(200).send('Password has been successfully reset.');
      } else {
        res.status(400).send('Password reset token is invalid or has expired.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).send('Error resetting password');
    }
  });
  
  
router.post('/request-reset', async (req, res) => {
    console.log('Request :',req.body)
    const { email } = req.body;
    const token = crypto.randomBytes(20).toString('hex');
  
    try {
      // Almacenar token en la base de datos junto con el email del usuario y una fecha de expiración
      await pool.execute(
        `UPDATE users SET resetPasswordToken=?, resetPasswordExpires=DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE email=?`,
        [token, email]
      );
  
      // Enviar email
      await sendResetEmail(email, token);
  
      res.status(200).send({isAuthenticated:true,message:'Reset password link has been sent to your email.'});
    } catch (error) {
      console.error('Reset Password Error:', error);
      res.status(500).send({isAuthenticated:false,message:'Error resetting password'});
    }
  });
module.exports = router;

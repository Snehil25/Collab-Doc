const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db');

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!user) throw new Error("Signup failed, user not returned by Supabase.");

    res.status(201).json({ msg: 'User registered successfully. Please sign in.' });
  } catch (err) {
    console.error("SIGNUP ERROR:", err.message);
    res.status(500).json({ msg: err.message || 'Server error during signup.' });
  }
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        if (!data.session) throw new Error("Signin failed, no session returned by Supabase.");

        const payload = {
            user: {
                id: data.user.id,
                email: data.user.email
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, 
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error("SIGNIN ERROR:", err.message);
        res.status(400).json({ msg: err.message || 'Invalid credentials' });
    }
});

module.exports = router;

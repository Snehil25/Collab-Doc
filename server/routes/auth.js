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
    if (!user) throw new Error("Signup failed, user not returned.");

    res.status(201).json({ msg: 'User registered successfully. Please sign in.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
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
        if (!data.session) throw new Error("Signin failed, no session returned.");

        const payload = {
            user: {
                id: data.user.id,
                email: data.user.email
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your_default_jwt_secret',
            { expiresIn: 3600 }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ msg: 'Invalid credentials' });
    }
});

module.exports = router;
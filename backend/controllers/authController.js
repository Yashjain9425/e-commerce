const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    // If user exists and already verified -> ask to login
    if (userExists && userExists.isVerified) {
      return res.status(400).json({ message: 'User already registered, please login' });
    }

    // If user exists but is not verified, regenerate OTP and resend
    if (userExists && !userExists.isVerified) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

      userExists.otp = otp;
      userExists.otpExpiry = otpExpiry;
      await userExists.save();

      const message = `
        <h2>ShopNest - Verify your email</h2>
        <p>Your new verification OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 5 minutes.</p>
      `;

      await sendEmail({
        email: userExists.email,
        subject: 'ShopNest - New OTP',
        message
      });

      return res.status(200).json({ message: 'Account exists but is not verified. New OTP sent.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP and expiry (5 minutes)
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Create user with isVerified=false and store OTP
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiry
    });

    if (user) {
      // Send OTP Email
      const message = `
        <h2>Welcome to ShopNest, ${name}!</h2>
        <p>Thank you for registering on our platform.</p>
        <p>Your one-time verification OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 5 minutes.</p>
      `;

      await sendEmail({
        email: user.email,
        subject: 'ShopNest - Verify your email',
        message
      });

      // Return minimal user info; do NOT auto-login until verified
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        message: 'Registration successful. Please verify your email using the OTP sent.'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP controller
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    if (!user.otp || !user.otpExpiry) return res.status(400).json({ message: 'No OTP found. Please request a new one.' });

    if (user.otp !== String(otp)) return res.status(400).json({ message: 'Invalid OTP' });

    if (new Date() > new Date(user.otpExpiry)) return res.status(400).json({ message: 'OTP has expired' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate token and return user info + token so frontend can auto-login
    const token = generateToken(user._id);
    const userPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({ success: true, message: 'OTP verified successfully', user: userPayload, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend OTP controller
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const message = `
      <h2>ShopNest OTP</h2>
      <p>Your new verification OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 5 minutes.</p>
    `;

    await sendEmail({ email: user.email, subject: 'ShopNest - Resend OTP', message });

    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUsers, verifyOtp, resendOtp };

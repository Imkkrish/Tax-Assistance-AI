import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {
  protect,
  rateLimitAuth,
  validatePAN,
  logAuth
} from '../middleware/auth.js';
import {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validateProfileUpdate
} from '../middleware/validation.js';
import { catchAsync } from '../middleware/errorHandler.js';
import User from '../models/User.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: {
        user
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateUserRegistration, validatePAN, catchAsync(async (req, res, next) => {
  const { name, email, password, pan, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Check PAN uniqueness if provided
  if (pan) {
    const existingPAN = await User.findOne({ pan });
    if (existingPAN) {
      return res.status(400).json({
        success: false,
        message: 'PAN number already registered'
      });
    }
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    pan,
    phone
  });

  logAuth('User registration')(req, res, () => {});
  sendTokenResponse(user, 201, res);
}));

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateUserLogin, rateLimitAuth(), catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if account is locked
  if (user.isLocked) {
    return res.status(423).json({
      success: false,
      message: 'Account is temporarily locked due to multiple failed login attempts'
    });
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    // Increment login attempts
    await user.incLoginAttempts();
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  logAuth('User login')(req, res, () => {});
  sendTokenResponse(user, 200, res);
}));

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, catchAsync(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
}));

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
}));

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, validateProfileUpdate, validatePAN, catchAsync(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    phone: req.body.phone,
    profile: req.body.profile,
    preferences: req.body.preferences
  };

  // Check PAN uniqueness if updating
  if (req.body.pan) {
    const existingPAN = await User.findOne({
      pan: req.body.pan.toUpperCase(),
      _id: { $ne: req.user._id }
    });
    if (existingPAN) {
      return res.status(400).json({
        success: false,
        message: 'PAN number already registered'
      });
    }
    fieldsToUpdate.pan = req.body.pan.toUpperCase();
  }

  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: {
      user
    }
  });
}));

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put('/updatepassword', protect, catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  if (!(await user.comparePassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
}));

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
router.post('/forgotpassword', catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  // In a real application, send email here
  console.log(`Password reset token: ${resetToken}`);

  res.status(200).json({
    success: true,
    message: 'Password reset token sent to email'
  });
}));

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
router.put('/resetpassword/:resettoken', validatePasswordReset, catchAsync(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
}));

// @desc    Verify email
// @route   POST /api/auth/verifyemail
// @access  Private
router.post('/verifyemail', protect, catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: 'Email already verified'
    });
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  user.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  await user.save();

  // In a real application, send email here
  console.log(`Email verification token: ${verificationToken}`);

  res.status(200).json({
    success: true,
    message: 'Verification token sent to email'
  });
}));

// @desc    Confirm email verification
// @route   POST /api/auth/confirmemail/:token
// @access  Private
router.post('/confirmemail/:token', protect, catchAsync(async (req, res, next) => {
  const verificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    _id: req.user._id,
    verificationToken
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid verification token'
    });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
}));

export default router;
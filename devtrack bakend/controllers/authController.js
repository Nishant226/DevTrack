const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// 1. Register User (Secure Multi-Role Support)
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Security check: Public signup par sirf non-admin roles allow honge.
    const allowedPublicRoles = ['Developer', 'Tester', 'DevOps', 'UI/UX Designer'];

    let assignedRole = 'Developer'; // Default role
    if (role) {
      const matchedRole = allowedPublicRoles.find(r => r.toLowerCase() === role.toLowerCase());
      if (matchedRole) {
        assignedRole = matchedRole;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: assignedRole
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("REGISTER ERROR CRASH:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 2. Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("LOGIN ERROR CRASH:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 3. Forgot Password Flow
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ 
      email: { $regex: new RegExp('^' + req.body.email + '$', 'i') } 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

   const message = `You have requested a password reset. Please click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.`;

    await sendEmail({
      email: user.email,
      subject: 'DevTrack - Password Reset Request',
      message
    });

    res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({ message: 'Email could not be sent', error: error.message });
  }
};

// 4. Reset Password Engine
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: 'Password reset successful. You can now login with new password.' });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 5. Delete User Account
exports.deleteUserAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 6. Get All Users (Admin Only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 7. Update User Role (Admin Only) - Fixed Token Overwrite Bug
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    const allowedRoles = ['Developer', 'Tester', 'DevOps', 'UI/UX Designer', 'Project Manager', 'Admin'];
    
    // Case-insensitive match check
    const matchedRole = allowedRoles.find(r => r.toLowerCase() === role.toLowerCase());
    if (!matchedRole) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: matchedRole },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let token = null;

    // IMPORTANT: Token sirf tabhi generate hoga jab admin ne apna khud ka role change kiya ho
    if (req.user && req.user.id.toString() === userId.toString()) {
      token = jwt.sign(
        { id: updatedUser._id, role: updatedUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${matchedRole} successfully`,
      token,
      data: updatedUser
    });
  } catch (error) {
    console.error("UPDATE USER ROLE ERROR:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
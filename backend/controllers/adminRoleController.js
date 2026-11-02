// backend/controllers/adminRoleController.js
const { User, ActivityLog } = require('../models');
const { logActivity } = require('../utils/logger');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Fetch all staff, admin, and delivery users + date-filtered logs
exports.getStaffUsers = async (req, res) => {
  try {
    const { date } = req.query; // Optional: "YYYY-MM-DD"

    const staff = await User.findAll({
      where: { role: ['admin', 'superadmin', 'staff', 'delivery'] },
      attributes: ['id', 'name', 'phone', 'role', 'createdAt']
    });

    const logWhere = {};
    if (date) {
      logWhere.createdAt = {
        [Op.between]: [`${date} 00:00:00`, `${date} 23:59:59`]
      };
    }

    const logs = await ActivityLog.findAll({
      where: logWhere,
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    return res.status(200).json({ success: true, staff, logs });
  } catch (error) {
    console.error('Fetch Staff Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve staff list.' });
  }
};

// Create or Update User Role (Supports both userId for inline changes and phone for form creation)
exports.updateUserRole = async (req, res) => {
  try {
    const { userId, name, phone, password, confirmPassword, role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required.' });
    }

    let user = null;
    if (userId) {
      user = await User.findByPk(userId);
    } else if (phone) {
      user = await User.findOne({ where: { phone } });
    }

    if (user) {
      const oldRole = user.role;
      const updateData = { role };
      if (name) updateData.name = name;

      if (password && password.trim() !== '') {
        if (password !== confirmPassword) {
          return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }
        updateData.password = await bcrypt.hash(password, 10);
      }

      await user.update(updateData);
      await logActivity(req, 'UPDATE_USER_ROLE', `Updated user ${user.name || user.phone} role from ${oldRole} to ${role}`);

      return res.status(200).json({
        success: true,
        message: `User ${user.phone || name} successfully updated to role: ${role}.`,
        user
      });
    } else {
      // Creating a new user via phone & password
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required to create a new staff account.' });
      }
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required to create a new staff account.' });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        name: name || 'Staff Member',
        phone,
        password: hashedPassword,
        role,
        is_verified: true
      });

      await logActivity(req, 'CREATE_STAFF_USER', `Created new ${role} account for ${name || phone} (${phone})`);

      return res.status(201).json({
        success: true,
        message: `New ${role} account created successfully for ${phone}!`,
        user
      });
    }
  } catch (error) {
    console.error('Update/Create User Role Error:', error);
    return res.status(500).json({ success: false, message: 'Server error saving user role.' });
  }
};

// Delete / Demote Staff Account
exports.deleteStaffUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Staff user not found.' });
    }

    const oldRole = user.role;
    user.role = 'customer';
    await user.save();

    await logActivity(req, 'DEMOTE_STAFF_USER', `Demoted staff user ${user.name || user.phone} from ${oldRole} to customer`);

    return res.status(200).json({
      success: true,
      message: 'Staff account successfully removed and demoted to customer.'
    });
  } catch (error) {
    console.error('Delete Staff Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete staff account.' });
  }
};
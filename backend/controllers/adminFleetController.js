// backend/controllers/adminFleetController.js
const { Driver, Order } = require('../models');

// 1. Get All Drivers & Active Fleet Manifest
exports.getFleetOverview = async (req, res) => {
  try {
    const drivers = await Driver.findAll({
      order: [['createdAt', 'DESC']]
    });

    const totalDrivers = drivers.length;
    const availableDrivers = drivers.filter(d => d.status === 'available').length;
    const onTripDrivers = drivers.filter(d => d.status === 'on_trip').length;

    return res.status(200).json({
      success: true,
      stats: { totalDrivers, availableDrivers, onTripDrivers },
      drivers
    });
  } catch (error) {
    console.error('Fetch Fleet Overview Error:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving fleet data.' });
  }
};

// 2. Add New Driver
exports.addDriver = async (req, res) => {
  try {
    const { name, phone, vehicleType, plateNumber } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
    }

    const driver = await Driver.create({
      name,
      phone,
      vehicleType: vehicleType || 'Motorcycle',
      plateNumber
    });

    return res.status(201).json({
      success: true,
      message: `Driver ${name} added successfully!`,
      driver
    });
  } catch (error) {
    console.error('Add Driver Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add driver to database.' });
  }
};

// 3. Update Driver Status (available | on_trip | offline)
exports.updateDriverStatus = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { status } = req.body;

    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    }

    await driver.update({ status });

    return res.status(200).json({
      success: true,
      message: `Driver ${driver.name} status updated to ${status}.`,
      driver
    });
  } catch (error) {
    console.error('Update Driver Status Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating driver status.' });
  }
};
// controllers/storeController.js
const { Store, User, sequelize } = require('../models');

// Addis Ababa Bounding Box Limits
const ADDIS_BOUNDS = {
  minLat: 8.8500,
  maxLat: 9.0800,
  minLng: 38.6500,
  maxLng: 38.9000,
};

const createStore = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, store_name, address, latitude, longitude, landmark } = req.body;
    const userId = req.user.id || req.user.userId;

    const finalName = (name || store_name || '').trim();

    if (!finalName || !address) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Store name and general address are required.' 
      });
    }

    // Validate coordinates if provided
    let latNum = null;
    let lngNum = null;
    let isVerified = false;

    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
      latNum = parseFloat(latitude);
      lngNum = parseFloat(longitude);

      const isWithinAddis = 
        latNum >= ADDIS_BOUNDS.minLat && latNum <= ADDIS_BOUNDS.maxLat &&
        lngNum >= ADDIS_BOUNDS.minLng && lngNum <= ADDIS_BOUNDS.maxLng;

      if (!isWithinAddis) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Store location must be within the Addis Ababa service area.',
        });
      }

      isVerified = true;
    }

    // Check for existing store
    const existingStore = await Store.findOne({ 
      where: { 
        [sequelize.Sequelize.Op.or]: [{ userId }, { user_id: userId }] 
      }, 
      transaction 
    });

    if (existingStore) {
      // 🔄 RESUBMISSION FLOW: If previously rejected, allow them to update & resubmit!
      if (existingStore.status === 'rejected') {
        existingStore.name = finalName;
        existingStore.store_name = finalName;
        existingStore.address = address.trim();
        existingStore.latitude = latNum;
        existingStore.longitude = lngNum;
        existingStore.landmark = landmark ? landmark.trim() : null;
        existingStore.isLocationVerified = isVerified;
        existingStore.is_location_verified = isVerified;
        existingStore.status = 'pending'; // 👈 Reset back to pending for admin approval
        existingStore.rejectionReason = null; // Clear old rejection note

        await existingStore.save({ transaction });
        await transaction.commit();

        return res.status(200).json({
          success: true,
          message: 'Store updated and resubmitted for admin review successfully.',
          store: existingStore,
        });
      }

      // Otherwise, block duplicate creation for active/pending stores
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A store is already linked to your account.',
        store: existingStore,
      });
    }

    // Insert Store Record with default 'pending' status for admin approval
    const newStore = await Store.create(
      {
        name: finalName,
        store_name: finalName,
        address: address.trim(),
        latitude: latNum,
        longitude: lngNum,
        landmark: landmark ? landmark.trim() : null,
        isLocationVerified: isVerified,
        is_location_verified: isVerified,
        userId: userId,
        user_id: userId,
        status: 'pending',
      },
      { transaction }
    );

    // Upgrade User Role to Vendor
    await User.update(
      { role: 'vendor' },
      { where: { id: userId }, transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Store created successfully and submitted for admin review.',
      store: newStore,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create Store Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create store.',
      error: error.message 
    });
  }
};

const getMyStore = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const store = await Store.findOne({ 
      where: { 
        [sequelize.Sequelize.Op.or]: [{ userId }, { user_id: userId }] 
      } 
    });

    if (!store) {
      return res.status(404).json({ 
        success: false, 
        message: 'No store found for this account.' 
      });
    }

    let storeData = store.toJSON();

    // Ensure bankAccounts is always returned as a valid array
    if (storeData.bankAccounts) {
      if (typeof storeData.bankAccounts === 'string') {
        try {
          storeData.bankAccounts = JSON.parse(storeData.bankAccounts);
        } catch (e) {
          storeData.bankAccounts = [];
        }
      }
    } else {
      storeData.bankAccounts = [];
    }

    return res.status(200).json({ success: true, store: storeData });
  } catch (error) {
    console.error('Get Store Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error retrieving store data.' 
    });
  }
};

const updateStoreProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { name, address, phoneNumber, landmark } = req.body;

    let store = await Store.findOne({ where: { user_id: userId } });
    
    if (!store) {
      store = await Store.create({
        user_id: userId,
        userId: userId,
        store_name: name,
        name: name,
        address,
        phoneNumber,
        landmark,
        status: 'pending',
      });
    } else {
      if (name) {
        store.store_name = name;
        store.name = name;
      }
      if (address) store.address = address;
      if (phoneNumber) store.phoneNumber = phoneNumber;
      if (landmark !== undefined) store.landmark = landmark;
      await store.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Store settings updated successfully!',
      store,
    });
  } catch (error) {
    console.error('Update Store Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating store settings.' });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findByPk(id);

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    // ☁️ Use req.file.path to capture the secure Cloudinary HTTPS URL automatically
    const imageUrl = req.file.path;

    await store.update({ logoUrl: imageUrl, logo_url: imageUrl });

    return res.status(200).json({
      success: true,
      message: 'Store profile image updated successfully.',
      imageUrl,
    });
  } catch (error) {
    console.error('Update Profile Image Error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating profile image.' });
  }
};

module.exports = {
  createStore,
  getMyStore,
  updateStoreProfile,
  updateProfileImage,
};
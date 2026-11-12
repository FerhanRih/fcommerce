// backend/controllers/adminAdController.js
const { Banner, Store, User, PaymentAccount } = require('../models');
const { Op } = require('sequelize');

const adminAdController = {
  // Get all ad banner requests
  getAdBanners: async (req, res) => {
    try {
      const now = new Date();

      // Automatically mark active ads past their expiration date as expired/inactive
      await Banner.update(
        { status: 'expired', isActive: false },
        { 
          where: { 
            status: 'active', 
            expiresAt: { [Op.lt]: now } 
          } 
        }
      );

      // Fetch all banners for the admin panel queue
      const banners = await Banner.findAll({
        order: [['createdAt', 'DESC']],
        include: [
          { model: Store, as: 'Store' },
          { model: User, as: 'User', attributes: ['id', 'name', 'phone'] }
        ]
      });

      return res.status(200).json({ success: true, banners });
    } catch (error) {
      console.error('Error fetching admin banners:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch banners.' });
    }
  },

  // Update banner status (approve / reject / update duration days)
  updateAdStatus: async (req, res) => {
    try {
      const { bannerId } = req.params;
      const { action, rejectionReason, durationDays } = req.body;

      const banner = await Banner.findByPk(bannerId);
      if (!banner) {
        return res.status(404).json({ success: false, message: 'Banner request not found.' });
      }

      if (action === 'approve') {
        const days = durationDays ? Number(durationDays) : banner.durationDays;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        banner.status = 'active';
        banner.isActive = true;
        banner.durationDays = days;
        banner.expiresAt = expiresAt;
        banner.rejectionReason = null;
      } else if (action === 'reject') {
        banner.status = 'rejected';
        banner.isActive = false;
        banner.rejectionReason = rejectionReason || 'Payment receipt or banner artwork did not meet guidelines.';
      } else if (action === 'update') {
        if (durationDays) {
          banner.durationDays = Number(durationDays);
          if (banner.status === 'active') {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + banner.durationDays);
            banner.expiresAt = expiresAt;
          }
        }
      }

      await banner.save();
      return res.status(200).json({ success: true, message: `Banner successfully updated!`, banner });
    } catch (error) {
      console.error('Error updating banner:', error);
      return res.status(500).json({ success: false, message: 'Failed to update banner.' });
    }
  },

  // Admin Direct Create Ad (House Ad / Manual)
  createAdminAd: async (req, res) => {
    try {
      const { title, subtitle, cta, tag, linkUrl, packageName, price, durationDays } = req.body;
      
      // ☁️ Use req.file.path to capture the secure Cloudinary HTTPS URL automatically
      const imageUrl = req.file ? req.file.path : req.body.imageUrl;

      if (!imageUrl) {
        return res.status(400).json({ success: false, message: 'Banner image is required.' });
      }

      const days = Number(durationDays || 7);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const newBanner = await Banner.create({
        title: title || 'Sponsored Spotlight',
        subtitle: subtitle || '',
        cta: cta || 'EXPLORE CATALOG',
        tag: tag || 'HOUSE AD',
        imageUrl,
        linkUrl: linkUrl || '#',
        packageName: packageName || 'Admin Custom Placement',
        price: price || 0,
        durationDays: days,
        status: 'active',
        isActive: true,
        expiresAt,
      });

      return res.status(201).json({ success: true, message: 'House ad published successfully!', banner: newBanner });
    } catch (error) {
      console.error('Error creating admin ad:', error);
      return res.status(500).json({ success: false, message: 'Failed to create ad.' });
    }
  },

  // Payment Accounts Management
  getPaymentAccounts: async (req, res) => {
    try {
      const accounts = await PaymentAccount.findAll({ where: { isActive: true } });
      return res.status(200).json({ success: true, accounts });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch payment accounts.' });
    }
  },

  savePaymentAccount: async (req, res) => {
    try {
      const { id, bankName, accountNumber, accountHolder, instructions } = req.body;
      if (id) {
        const acc = await PaymentAccount.findByPk(id);
        if (acc) {
          await acc.update({ bankName, accountNumber, accountHolder, instructions });
          return res.status(200).json({ success: true, message: 'Account updated successfully!', account: acc });
        }
      }
      const newAcc = await PaymentAccount.create({ bankName, accountNumber, accountHolder, instructions });
      return res.status(201).json({ success: true, message: 'Payment account added successfully!', account: newAcc });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to save payment account.' });
    }
  },

  deletePaymentAccount: async (req, res) => {
    try {
      const { id } = req.params;
      await PaymentAccount.destroy({ where: { id } });
      return res.status(200).json({ success: true, message: 'Payment account removed.' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete account.' });
    }
  }
};

module.exports = adminAdController;
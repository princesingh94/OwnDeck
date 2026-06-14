const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Product = require("../models/Product");
const User = require("../models/User");

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
    })
  : null;

const daysBetween = (a, b) => Math.ceil((b - a) / (1000 * 60 * 60 * 24));

const sendAlertEmail = async (to, product) => {
  if (!transporter || !to) {
    console.log(`Alert skipped (no SMTP): ${product.productName}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.ALERT_FROM_EMAIL || "no-reply@owndeck.local",
    to,
    subject: `Warranty expiring soon: ${product.productName}`,
    text: `Your warranty for ${product.productName} expires on ${new Date(product.warrantyExpiryDate).toDateString()}.`
  });
};

const processExpiryAlerts = async () => {
  const now = new Date();
  const products = await Product.find({ "alerts.preExpiry30Sent": false });

  for (const product of products) {
    const days = daysBetween(now, new Date(product.warrantyExpiryDate));
    if (days <= 30 && days >= 0) {
      const user = await User.findById(product.user);
      await sendAlertEmail(user?.email, product);
      product.alerts.preExpiry30Sent = true;
      await product.save();
    }
  }
};

const startAlertCron = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      await processExpiryAlerts();
      console.log("Expiry alert cron executed");
    } catch (error) {
      console.error("Alert cron error", error.message);
    }
  });
};

module.exports = { startAlertCron, processExpiryAlerts };


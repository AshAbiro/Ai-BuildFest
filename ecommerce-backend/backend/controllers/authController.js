const Shop = require('../models/Shop');
const User = require('../models/User');
const OTP = require('../models/OTP');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const { shopRegistrationSchema } = require('../validations/shopValidation');
const {
    loginUserSchema,
    registerCustomerSchema
} = require('../validations/userValidation');

// const getCookieOptions = () => {
//     const options = {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'lax',
//         maxAge: 7 * 24 * 60 * 60 * 1000
//     };
//
//     if (process.env.NODE_ENV === 'production') {
//         options.domain = '.scaleup.codes';
//     }
//
//     return options;
// };
const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        // Must be 'none' to allow cross-origin cookies between vercel.app subdomains
        sameSite: isProduction ? 'none' : 'lax',
        partitioned: isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
        // Do not set domain. If unset, it defaults to the backend's domain which is correct.
    };
};
exports.sendOTP = async (req, res) => {
    try {
        console.log('Backend OTP Started for:', req.body.email);
        const { email } = req.body;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        console.log('Updating OTP in DB...');
        await OTP.findOneAndUpdate(
            { email },
            {
                otp,
                createdAt: Date.now()
            },
            {
                upsert: true,
                new: true
            }
        );
        console.log('OTP updated in DB. Connecting to SMTP...');

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            connectionTimeout: 5000,
            greetingTimeout: 5000,
            socketTimeout: 5000,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"ScaleUp" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verification Code',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4f46e5;">Verification Code</h2>
                    <p>Use the following code to complete your registration:</p>
                    <h1 style="letter-spacing: 5px; color: #1e293b;">${otp}</h1>
                    <p style="color: #64748b; font-size: 12px;">
                        This code will expire in 5 minutes.
                    </p>
                </div>
            `
        });
        console.log('OTP email sent via SMTP successfully.');

        res.status(200).json({
            success: true,
            message: 'OTP sent to email'
        });

    } catch (error) {
        console.error('Backend OTP Error:', error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.registerVendor = async (req, res) => {
    try {
        const { error, value } = shopRegistrationSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: error.details[0].message
            });
        }

        const {
            shopName,
            subdomain,
            email,
            password,
            fullName,
            otp
        } = value;

        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord || String(otpRecord.otp) !== String(otp)) {
            return res.status(400).json({
                error: 'Invalid or expired verification code.'
            });
        }

        const existingShop = await Shop.findOne({ subdomain });

        if (existingShop) {
            return res.status(400).json({
                error: 'Subdomain already taken.'
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                error: 'Email already registered.'
            });
        }

        const newShop = await Shop.create({
            shopName,
            subdomain
        });

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);

        const newAdmin = await User.create({
            fullName,
            email,
            password: hashedPassword,
            role: 'VendorAdmin',
            shop_id: newShop._id
        });

        await OTP.deleteOne({ email });

        const token = jwt.sign(
            {
                id: newAdmin._id,
                role: newAdmin.role,
                shopId: newAdmin.shop_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        res.cookie('token', token, getCookieOptions());

        res.status(201).json({
            message: 'Shop and Vendor account created successfully',
            token,
            user: {
                id: newAdmin._id,
                fullName: newAdmin.fullName,
                shopId: newShop._id
            }
        });

    } catch (err) {
        console.error('Register Vendor Error:', err);

        res.status(500).json({
            error: 'Registration failed',
            dev_details: err.message
        });
    }
};

exports.registerCustomer = async (req, res) => {
    try {
        const { error, value } = registerCustomerSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: error.details[0].message
            });
        }

        const {
            fullName,
            email,
            password,
            subdomain,
            otp
        } = value;

        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord || String(otpRecord.otp) !== String(otp)) {
            return res.status(400).json({
                error: 'Invalid or expired verification code.'
            });
        }

        const targetShop = await Shop.findOne({ subdomain });

        if (!targetShop) {
            return res.status(404).json({
                error: 'Storefront not found.'
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                error: 'Email already registered.'
            });
        }

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt);

        const newCustomer = await User.create({
            fullName,
            email,
            password: hashedPassword,
            role: 'Customer',
            shop_id: targetShop._id
        });

        await OTP.deleteOne({ email });

        const token = jwt.sign(
            {
                id: newCustomer._id,
                role: newCustomer.role,
                shopId: newCustomer.shop_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        res.cookie('token', token, getCookieOptions());

        res.status(201).json({
            message: 'Customer account created successfully',
            token,
            user: {
                id: newCustomer._id,
                fullName: newCustomer.fullName,
                shopId: newCustomer.shop_id
            }
        });

    } catch (err) {
        console.error('Register Customer Error:', err);

        res.status(500).json({
            error: 'Registration failed.'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { error, value } = loginUserSchema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: error.details[0].message
            });
        }

        const { email, password } = value;

        const user = await User.findOne({ email }).lean();

        if (!user) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                shopId: user.shop_id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        res.cookie('token', token, getCookieOptions());

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                role: user.role,
                shopId: user.shop_id,
                email: user.email
            }
        });

    } catch (err) {
        console.error('Login Error:', err);

        res.status(500).json({
            error: 'Login failed'
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        if (!userId) {
            return res.status(400).json({
                error: 'User ID missing from request'
            });
        }

        const user = await User.findById(userId)
            .select('-password')
            .lean();

        if (!user) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        if (user.shop_id) {
            const shop = await Shop.findById(user.shop_id)
                .select('shopName subdomain')
                .lean();

            if (shop) {
                user.shopName = shop.shopName;
                user.subdomain = shop.subdomain;
            }
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (err) {
        console.error('GetMe Error:', err);

        res.status(500).json({
            error: 'Error fetching user session'
        });
    }
};

exports.logout = (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        partitioned: isProduction,
        path: '/',
        expires: new Date(0)
    };

    res.cookie('token', 'none', cookieOptions);

    res.status(200).json({
        message: 'Logged out successfully'
    });
};

exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters.' });
        }

        const userId = req.user._id || req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully.' });

    } catch (err) {
        console.error('UpdatePassword Error:', err);
        res.status(500).json({ error: 'Failed to update password.' });
    }
};
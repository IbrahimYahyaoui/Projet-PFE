const User = require("../schemas/user");
const crypto = require("crypto");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const generatePassword = () => {
  return crypto.randomBytes(6).toString("hex");
};

// ── GET tous les users ──
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── GET mon profil ──
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── UPDATE user ──
const updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── CREATE user ──
const createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const generatedPassword = generatePassword();
    const user = new User({ name, email, password: generatedPassword, role });
    await user.save();

    try {
      await resend.emails.send({
        from: "TicketFlow <onboarding@resend.dev>",
        to: email,
        subject: "Your TicketFlow Account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px;">
            <h2 style="color: #111; margin-bottom: 5px;">Welcome to TicketFlow!</h2>
            <p style="color: #666; margin-top: 0;">Hi ${name}, your account has been created.</p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 13px;">Your login credentials:</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Password:</strong> ${generatedPassword}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Role:</strong> ${role}</p>
            </div>
            <p style="color: #c62828; font-size: 13px;">Please change your password after your first login.</p>
            <p style="color: #666; font-size: 13px;">— TicketFlow Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.log("Email sending failed:", emailError);
    }

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      generatedPassword,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── DELETE user ──
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  getMe,
  updateUser,
  createUser,
  deleteUser,
};
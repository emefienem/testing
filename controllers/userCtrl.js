const Users = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const userCtrl = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const user = await Users.findOne({ email });
      if (user)
        return res.status(400).json({ msg: "This email already exists" });

      if (password < 6)
        return res
          .status(400)
          .json({ msg: "password should be at least 6 characters long" });

      const hashPassword = await bcrypt.hash(password, 10);

      const newUser = new Users({
        name,
        email,
        password: hashPassword,
      });
      await newUser.save();
      const accesstoken = createAccessToken({ id: newUser._id });
      const refreshtoken = createRefreshToken({ id: newUser._id });
      res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        path: "/user/refresh-token",
        maxAge: 60 * 60 * 24 * 30 * 1000,
        signed: true,
      });

      return res.json({ accesstoken });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      res.clearCookie("refreshtoken", {
        path: "/user/refresh-token",
      });

      const user = await Users.findOne({ email });
      if (!user) return res.status(400).json({ msg: "User does not exist" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ msg: "Incorrect Password" });

      const accesstoken = createAccessToken({ id: user._id });
      const refreshtoken = createRefreshToken({ id: user._id });
      res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        path: "/user/refresh-token",
        maxAge: 60 * 60 * 24 * 30 * 1000,
        signed: true,
      });

      return res.json({ accesstoken });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", {
        path: "/user/refresh-token",
      });
      res.json({ msg: "Logged Out" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const rf_token = req.signedCookies.refreshtoken;
      console.log(rf_token);
      if (!rf_token)
        return res.status(400).json({ msg: "Please Login or Register" });

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(400).json({ msg: "Login or Register now" });
        const accesstoken = createAccessToken({ id: user.id });

        return res.json({ accesstoken });
      });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  getUser: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select("-password");
      if (!user) return res.status(400).json({ msg: "User does not exit" });

      return res.json(user);
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  addCart: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id);
      if (!user) return res.status(400).json({ msg: "User does not exit" });
      await Users.findOneAndUpdate(
        { _id: req.user.id },
        {
          cart: req.body.cart,
        }
      );
      return res.json({ msg: "Added to cart" });
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      const resetToken = jwt.sign({ email }, process.env.RESET_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.json(resetToken);

      await Users.findOneAndUpdate(
        { email },
        { $set: { resetToken, resetTokenExp: null } }
      );

      const resetLink = `${process.env.CLIENT_URL}/reset/${resetToken}`;

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MY_EMAIL,
          pass: process.env.MY_PASS,
        },
      });

      const mailOptions = {
        from: process.env.MY_EMAIL,
        to: email,
        subject: "Password reset",
        text: `Click on this link for password reset: ${resetLink}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res
            .status(500)
            .json({ msg: "Failed to  send reset password link" });
        }
        console.log("Email sent: " + info.response);
        return res.json({ msg: "Reset link sent" });
      });
    } catch (error) {
      res.status(500).json({ msg: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { resetToken, newPassword } = req.body;

      jwt.verify(
        resetToken,
        process.env.RESET_TOKEN_SECRET,
        async (err, user) => {
          if (err) {
            console.log(err);
            return res.status(400).json({ msg: "Invalid or expired token" });
          }

          const userInDb = await Users.findOne({ resetToken });
          if (!userInDb)
            return res.status(400).json({ msg: "Token has expired!" });

          const hashPassword = await bcrypt.hash(newPassword, 10);

          await Users.findOneAndUpdate(
            { _id: userInDb._id },
            {
              $set: {
                password: hashPassword,
                resetToken: "",
                resetTokenExp: null,
              },
            }
          );
          return res.json({ msg: "Password reset successfully" });
        }
      );
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
};

const createAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
};

const createRefreshToken = (user) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

module.exports = userCtrl;

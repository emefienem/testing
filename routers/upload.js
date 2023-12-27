const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary");
const fs = require("fs");
const auth = require("../middleware/auth");
const authAdmin = require("../middleware/authAdmin");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET_KEY,
});

router.post("/upload", auth, authAdmin, (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0)
      res.status(400).json({ msg: "No files were uploaded" });

    const file = req.files.file;

    if (file.size > 1024 * 1024) {
      removeTemp(file.tempFilePath);
      return res.status(400).json({ msg: "Size is too large" });
    }

    if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
      removeTemp(file.tempFilePath);
      return res.status(400).json({ msg: "This file format is not supported" });
    }

    cloudinary.v2.uploader.upload(
      file.tempFilePath,
      { folder: "test" },
      async (error, result) => {
        if (error) throw error;
        removeTemp(file.tempFilePath);
        res.json({ public_id: result.public_id, url: result.secure_url });
      }
    );
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
});

router.post("/destroy", auth, authAdmin, (req, res) => {
  try {
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ msg: "No image selected" });

    cloudinary.v2.uploader.destroy(public_id, async (error, result) => {
      if (error) throw error;

      res.json({ msg: "Deleted image successfully" });
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

const removeTemp = (path) => {
  fs.unlink(path, (error) => {
    if (error) throw error;
  });
};

module.exports = router;

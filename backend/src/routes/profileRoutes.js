const express = require("express");
const {
  createProfileItem,
  deleteProfileItem,
  getProfile,
  updateProfileItem,
  uploadAvatar,
  uploadProjectImage,
} = require("../controllers/profileController");
const { requireAuth } = require("../middleware/auth");
const imageUpload = require("../middleware/imageUpload");

const router = express.Router();
router.use(requireAuth);

router.get("/", getProfile);
router.post("/avatar", imageUpload.single("image"), uploadAvatar);
router.post("/project-image", imageUpload.single("image"), uploadProjectImage);

for (const resource of ["education", "experiences", "certificates", "projects"]) {
  router.post(`/${resource}`, createProfileItem(resource));
  router.patch(`/${resource}/:itemId`, updateProfileItem(resource));
  router.delete(`/${resource}/:itemId`, deleteProfileItem(resource));
}

module.exports = router;

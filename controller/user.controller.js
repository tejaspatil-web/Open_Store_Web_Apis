import { v2 as cloudinary } from "cloudinary";
import { User } from "../model/user.model.js";

async function allUsers(req, res) {
  try {
    const users = await User.find({}, { password: 0, __v: 0 });

    res.json(users);
  } catch (err) {
    res.json({ massage: err });
  }
}

async function singleUser(req, res) {
  try {
    const userId = req.params.id;
    const foundUser = await User.findById(userId, {
      password: 0,
      __v: 0,
    });
    if (foundUser) {
      res.status(200).json(foundUser);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
}

async function addNewUser(req, res) {
  try {
    let imageUrl;
    let imageId;
    const { name, email, password, number, image } = req.body;

    if (image) {
      await cloudinary.uploader.upload(image, (error, result) => {
        if (result) {
          imageUrl = result.url;
          imageId = result.public_id;
                  } else if (error) {
          res.sendStatus(401, error);
        }
      });
    }

    const isEmailExits = (
      await User.find({}, { password: 0, __v: 0 })
    ).findIndex((element) => element.email === email);

    if (isEmailExits > -1) {
      res.statusCode = 400
      res.send(
        "This Email Id Already Registered Please Use deferent Email Id..!"
      );
    } else {
      const newUser = new User({
        name: name,
        email: email,
        password: password,
        number: number,
        imageUrl: imageUrl,
        imageId: imageId,
      });

      await newUser.save();
       res.status=200
       res.send({ message: "User Saved Successfully" });
    }
  } catch (error) {
    res.status=400
    res.send({ error:error});
  }
}

async function updateUser(req, res) {
  try {
    let { name, email, password, number, imageId } = await JSON.parse(req.body.data);
    let image = req.file.path
    const userId = await req.params.id;

    if (image && imageId) {
      await cloudinary.uploader.upload(
        image,
        { public_id: imageId },
        (error, result) => {
          if (result) {
            image = result.url;
            imageId = result.public_id;
          } else if (error) {
            res.sendStatus(401, error);
          }
        }
      );
    }

    await User.findOneAndUpdate(
      { _id: userId },
      {
        name: name,
        email: email,
        password: password,
        number: number,
        imageUrl: image,
        imageId: imageId,
      },
      { new: true } // This option returns the updated document
    )
      .then((updatedUser) => {
        res.status(200).json({ message: "User updated", user: updatedUser });
      })
      .catch((error) => {
        res
          .status(500)
          .json({ message: "Error updating user", error: error.message });
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = await req.params.id;
    const data = await User.findById(userId);
    await User.deleteOne({ _id: userId })
      .then(async (result) => {
        if (result.deletedCount > 0) {
          // Delete Image From Cloudinary
          if (data.imageUrl && data.imageId) {
            await cloudinary.uploader.destroy(data.imageId, (error, result) => {
              if (result) {
                console.log(result);
              } else if (error) {
                res.sendStatus(401, error);
              }
            });
          }
          res.status(200).json({ message: "User deleted successfully" });
        } else {
          res.status(400).json({ message: "User not found or not deleted" });
        }
      })
      .catch((error) => {
        res
          .status(500)
          .json({ message: "Error deleting user", error: error.message });
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
}

// Function to delete the image from the local path
function deleteLocalImage(path) {
  fs.unlink(path, (err) => {
    if (err) {
      console.error("Error deleting the file:", err);
    } else {
      console.log("File deleted successfully");
    }
  });
}

export { allUsers, singleUser, addNewUser, updateUser, deleteUser };

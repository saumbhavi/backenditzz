
import {Router} from "express";
import {loginUser,registerUser,logoutUser,refreshaccessToken} from "../controllers/user.controllers.js"
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

//secured routes 
const router=Router();

router.route("/logout").post(logoutUser)


router.route("/register").post(
    
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser

)

router.route("/login").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshaccessToken)



export default router



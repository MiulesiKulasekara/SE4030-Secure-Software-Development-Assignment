import express from "express";
import ProductController from "../controllers/ProductController.js";
import UploadImages from "../middleware/uploadImages.js";
import axios from "axios";
import expressRateLimit from "express-rate-limit"

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const response = await axios.post('http://userauth:7002/api/user/verify', {
            token: token
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        req.user = response.data.user;
        next();
    } catch (error) {
        console.log(error)
        res.status(401).json({ message: 'Unauthorized' });
    }
};

//Implement rate limiting to prevent denial-of-service (DoS) attacks, where an attacker could overload the server by making too many requests in a short period
//Prevent Allocation of Resources Without Limits or Throttling
const uploadLimit = expressRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: "Too many upload requests from this IP, please try again later."
});

const router = express.Router();

router.post('/', ProductController.createProduct);
router.put('/upload/:id',
    verifyToken,
    UploadImages.uploadPhoto.array('images', 10),
    UploadImages.productImgResize,
    uploadLimit,
    ProductController.uploadImages
);
router.get('/:id', ProductController.getaProduct);
router.get('/', ProductController.getAllProducts);
router.put('/rating', verifyToken, ProductController.rating);
router.put('/:id', verifyToken, ProductController.updateProduct);
router.put("/", ProductController.bulkUpdate)
router.delete('/:id', ProductController.deleteProduct);
router.post('/', ProductController.createProduct);

export default router;
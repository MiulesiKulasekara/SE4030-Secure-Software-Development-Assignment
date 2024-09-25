import asyncHandler from "express-async-handler";
import Product from "../models/ProductModel.js";
import slugify from "slugify";
import cloudinaryUploadImg from "../utils/cloudinary.js";
import fs from 'fs';
import axios from "axios";
import rateLimit from "express-rate-limit";
import Joi from "joi"; // For input validation

// function to add new product to the system
const createProduct = asyncHandler(async (req, res) => {
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const newProduct = await Product.create(req.body);
        res.json({
            message: "Product created",
            newProduct: newProduct,
        })
    } catch (error) {
        throw new Error(error);
    }
});

//function to get a specific product to home page
const getaProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id).populate("ratings");
        if (!product) {
            res.json(null);
        } else {
            // populate product ratings
            const populatedProduct = await Promise.all(
                product.ratings.map(async (rating) => {
                    const { postedby } = rating;
                    const response = await axios.get(`http://userauth:7002/api/user/${postedby}`);
                    const { data: user } = response;
                    return { ...rating.toObject(), postedby: user };
                })
            );
            res.json({ ...product.toObject(), ratings: populatedProduct });
        }

    } catch (error) {
        throw new Error(error);
    }
});

// function to get all products to home page
const getAllProducts = asyncHandler(async (req, res) => {
    try {
        // query products
        const queryObj = { ...req.query };
        const excludeFields = ['page', 'sort', 'limit', 'fields'];
        excludeFields.forEach(el => delete queryObj[el]);

        // filter by price
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        let query = Product.find(JSON.parse(queryStr));

        // sort products
        if (req.query.sort) {
            if (typeof req.query.sort === 'string') {
                const sortBy = req.query.sort.split(',').join(" ");
                query = query.sort(sortBy);
            } else {
                throw new Error("Invalid sort parameter");
            }
        } else {
            query = query.sort("-createdAt");
        }

        // select specific fields
        if (req.query.fields) {
            // Validate if fields is a string
            if (typeof req.query.fields === 'string') {
                const fields = req.query.fields.split(',').join(" ");
                query = query.select(fields);
            } else {
                throw new Error("Invalid fields parameter");
            }
        } else {
            query = query.select("-__v");
        }

        // pagination
        const page = req.query.page * 1 || 1; // convert page to number, default is 1
        const limit = req.query.limit * 1 || 100; // default limit
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);

        if (req.query.page) {
            const productCount = await Product.countDocuments();
            if (skip >= productCount) {
                throw new Error("This Page does not exist");
            }
        }

        const products = await query;
        res.json(products);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// function to update a product
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        if (req.body.title) {
            req.body.slug = slugify(req.body.title);
        }
        const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
        res.json(product);
    } catch (error) {
        throw new Error(error);
    }
});

// function to delete a product
const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findByIdAndDelete(id);
        res.json(product);
    } catch (error) {
        throw new Error(error);
    }
});

//product rating
const rating = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { star, prodId, comment } = req.body;
    try {
        //get Product
        const product = await Product.findById(prodId);
        //check the user has already reviewed
        let alreadyRated = product.ratings.find(
            (userId) => userId.postedby.toString() === _id.toString()
        );
        //Update the review if already rated before
        if (alreadyRated) {
            const updateRating = await Product.updateOne({
                ratings: { $elemMatch: alreadyRated }
            }, {
                $set: {
                    "ratings.$.star": star,
                    "ratings.$.comment": comment
                },
            }, {
                new: true,
            });
        } else {
            //create review
            const rateProduct = await Product.findByIdAndUpdate(prodId, {
                $push: {
                    ratings: {
                        star: star,
                        comment: comment,
                        postedby: _id
                    }
                }
            }, {
                new: true,
            });
        }
        const getAllratings = await Product.findById(prodId);
        let totalRatings = getAllratings.ratings.length;
        let ratingsum = getAllratings.ratings.map((item) => item.star).reduce((prev, curr) => prev + curr, 0);
        let actualRating = Math.round(ratingsum / totalRatings); //calculate actual rating
        let finalProduct = await Product.findByIdAndUpdate(prodId, {
            totalrating: actualRating,
        })
        res.json(finalProduct)
    } catch (error) {
        throw new Error(error);
    }
});

//Implement rate limiting to prevent denial-of-service (DoS) attacks, where an attacker could overload the server by making too many requests in a short period
//Prevent Allocation of Resources Without Limits or Throttling
const uploadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many upload requests from this IP, please try again later.'
});

// Upload images
const uploadImages = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { _id } = req.user;
    try {
        const uploader = (path) => cloudinaryUploadImg(path, "images");
        const urls = [];
        const files = req.files;
        for (const file of files) {
            const { path } = file;
            const newPath = await uploader(path);
            urls.push(newPath);
            fs.unlinkSync(path);
        }
        const findProduct = await Product.findByIdAndUpdate(id, {
            images: urls.map((file) => {
                return file;
            })
        }, {
            new: true,
        })
        res.json(findProduct);
    } catch (error) {
        throw new Error(error);
    }
});

// const bulkUpdate = asyncHandler(async (req, res) => {
//     const { updates } = req.body;

//     try {

//         updates.forEach((update) => {
//             console.log(update.updateOne.filter._id)
//             const { _id } = update.updateOne.filter._id
//             const { quantity } = update.updateOne.update.$inc.quantity
//             const { sold } = update.updateOne.update.$inc.sold
//             Product.findByIdAndUpdate(_id, {
//                 sold: sold,
//                 quantity: quantity
//             }).exec();
//         });
//         console.log("updated successfully")
//     } catch (error) {
//         console.log(error);
//     }
// })

const updateSchema = Joi.object({
    updates: Joi.array().items(
        Joi.object({
            updateOne: Joi.object({
                filter: Joi.object({
                    _id: Joi.string().required() // Validate the presence of _id as a string
                }).required(),
                update: Joi.object({
                    $inc: Joi.object({
                        quantity: Joi.number().required(),  // Ensure quantity is a number
                        sold: Joi.number().required()      // Ensure sold is a number
                    }).required()
                }).required()
            }).required()
        })
    ).required()
});

// Bulk update function with validation
const bulkUpdate = asyncHandler(async (req, res) => {
    const { error } = updateSchema.validate(req.body);  // Validate request body

    if (error) {
        return res.status(400).send({ error: error.details[0].message });  // Send validation error
    }

    const { updates } = req.body;

    try {
        updates.forEach(async (update) => {
            const { _id } = update.updateOne.filter;
            const { quantity, sold } = update.updateOne.update.$inc;

            // Safely update the product in the database
            await Product.findByIdAndUpdate(_id, {
                $set: { sold: sold, quantity: quantity }
            }).exec();
        });

        console.log("Updated successfully");
        res.status(200).send({ message: "Products updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "An error occurred during the update process" });
    }
});


export default {
    createProduct,
    getaProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    rating,
    uploadImages,
    uploadLimiter,
    bulkUpdate
}
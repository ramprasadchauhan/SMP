// import jwt from "jsonwebtoken";

// export const verifyToken = (req, res, next) => {
//   try {
//     const token = req.header("authorization")?.split(" ")[1];
//     console.log("token ", token);

//     const decryptedToken = jwt.verify(token, process.env.JWT_SECRET);
//     req.body.userId = decryptedToken.userId;
//     next();
//   } catch (error) {
//     console.log("error in verifyToken middleware", error)
//     res.json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const token = req.header("authorization")?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is required",
      });
    }
    console.log("token ", token);

    const decryptedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.body.userId = decryptedToken.userId;
    next();
  } catch (error) {
    console.log("error in verifyToken middleware", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

import { identifyService } from "./service.js";

export const identify = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ message: "Email or phoneNumber required" });
    }

    const response = await identifyService(email, phoneNumber);

    return res.status(200).json(response);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
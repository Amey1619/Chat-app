const asyncHandler = require("express-async-handler");
const Fuse = require("fuse.js");
const User = require("../models/userModel");
const generatedToken = require("../config/generateToken");
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all ther Fields");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
  });
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generatedToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to create the user");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generatedToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email Or Password");
  }
});

// /api/user?search=amey (Fuzzy Search Implementation)
const allUsers = asyncHandler(async (req, res) => {
  const searchTerm = req.query.search;

  // If no search term, return recent users
  if (!searchTerm || searchTerm.trim() === "") {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email pic") // Select only needed fields
      .limit(20)
      .sort({ createdAt: -1 }); // Most recent users first
    return res.send(users);
  }

  const trimmedSearch = searchTerm.trim();
  let finalResults = [];

  try {
    // STEP 1: Exact matches (highest priority)
    const exactMatches = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { name: { $regex: `^${trimmedSearch}`, $options: "i" } }, // Starts with
            { email: { $regex: `^${trimmedSearch}`, $options: "i" } },
            {
              name: {
                $regex: `^${trimmedSearch.split(" ")[0]}`,
                $options: "i",
              },
            }, // First name match
          ],
        },
      ],
    })
      .select("name email pic")
      .limit(5);

    finalResults = [...exactMatches];

    // STEP 2: Partial matches (if exact matches < 3)
    if (exactMatches.length < 3) {
      const partialMatches = await User.find({
        $and: [
          { _id: { $ne: req.user._id, $nin: exactMatches.map((u) => u._id) } }, // Exclude already found
          {
            $or: [
              { name: { $regex: trimmedSearch, $options: "i" } },
              { email: { $regex: trimmedSearch, $options: "i" } },
            ],
          },
        ],
      })
        .select("name email pic")
        .limit(10);

      finalResults = [...finalResults, ...partialMatches];
    }

    // STEP 3: Fuzzy search (if still not enough results)
    if (finalResults.length < 5 && trimmedSearch.length >= 2) {
      const excludeIds = finalResults.map((u) => u._id);
      const remainingUsers = await User.find({
        _id: {
          $ne: req.user._id,
          $nin: excludeIds,
        },
      })
        .select("name email pic")
        .limit(100); // Limit for performance

      if (remainingUsers.length > 0) {
        // Configure Fuse.js for fuzzy search
        const fuseOptions = {
          keys: [
            { name: "name", weight: 0.7 }, // Name is more important
            { name: "email", weight: 0.3 },
          ],
          threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
          distance: 100,
          includeScore: true,
          minMatchCharLength: 2,
          ignoreLocation: true,
          findAllMatches: false,
        };

        const fuse = new Fuse(remainingUsers, fuseOptions);
        const fuzzyResults = fuse.search(trimmedSearch);

        // Filter and sort fuzzy results
        const goodFuzzyMatches = fuzzyResults
          .filter((result) => result.score < 0.6) // Only good matches
          .slice(0, 5) // Limit fuzzy results
          .map((result) => result.item);

        finalResults = [...finalResults, ...goodFuzzyMatches];
      }
    }

    // Limit total results and remove duplicates
    const uniqueResults = finalResults
      .filter(
        (user, index, self) =>
          index ===
          self.findIndex((u) => u._id.toString() === user._id.toString())
      )
      .slice(0, 15);
    res.send(uniqueResults);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Search failed", error: error.message });
  }
});

module.exports={registerUser, authUser , allUsers};
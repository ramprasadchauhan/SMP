// Development/test fixtures. These accounts exist only in throw-away local
// databases (in-memory server or a localhost mongod); never in a shared one.
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Bids from "../models/bidModel.js";
import Notification from "../models/notificationModel.js";

export const FIXTURE_PASSWORD = "Fixture#2024";

export const FIXTURE_USERS = {
  admin: { name: "Avery Admin", email: "admin@smp.test", role: "admin" },
  admin2: { name: "Morgan Moderator", email: "moderator@smp.test", role: "admin" },
  seller: { name: "Sam Seller", email: "seller@smp.test", role: "user" },
  buyer: { name: "Bailey Buyer", email: "buyer@smp.test", role: "user" },
  blocked: { name: "Blake Blocked", email: "blocked@smp.test", role: "user", status: "blocked" },
};

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * DAY);

export async function seedFixtures({ extraUsers = 0, rich = false } = {}) {
  const password = await bcrypt.hash(FIXTURE_PASSWORD, 10);
  const users = {};
  let i = 0;
  for (const [key, u] of Object.entries(FIXTURE_USERS)) {
    const at = daysAgo(40 - i++ * 3);
    users[key] = await User.create({ ...u, password, createdAt: at, updatedAt: at });
  }
  const names = ["Jordan Lee", "Priya Nair", "Diego Alvarez", "Mei Chen", "Omar Haddad", "Lena Novak", "Kofi Mensah", "Sofia Rossi", "Arjun Mehta", "Hana Sato", "Ethan Brooks", "Zara Khan"];
  for (let n = 0; n < extraUsers; n++) {
    const at = daysAgo(Math.floor((n * 29) / Math.max(1, extraUsers)));
    const name = names[n % names.length] + (n >= names.length ? ` ${n}` : "");
    await User.create({
      name,
      email: `user${n + 1}@smp.test`,
      password,
      status: n % 7 === 3 ? "blocked" : "active",
      createdAt: at,
      updatedAt: at,
    });
  }

  const base = {
    billAvailable: true,
    warrantyAvailable: false,
    accessoriesAvailable: true,
    boxAvailable: false,
    seller: users.seller._id,
  };
  const products = {
    camera: await Product.create({ ...base, name: "Mirrorless Camera", description: "Compact mirrorless camera with two lenses, lightly used.", price: 640, category: "electronics", age: 2, status: "approved", showBidsOnProductPage: true }),
    jacket: await Product.create({ ...base, name: "Leather Jacket", description: "Genuine leather jacket, size M, excellent condition.", price: 120, category: "fashion", age: 4, status: "approved" }),
    bike: await Product.create({ ...base, name: "Road Bike", description: "Aluminium road bike, 21 gears, recently serviced.", price: 300, category: "sports", age: 7, status: "pending" }),
    lamp: await Product.create({ ...base, name: "Desk Lamp", description: "Adjustable LED desk lamp with dimmer.", price: 25, category: "home", age: 1, status: "rejected" }),
  };

  if (rich) {
    const extra = [
      ["Noise-cancelling Headphones", "electronics", 180, 1, "approved"],
      ["Espresso Machine", "home", 210, 3, "approved"],
      ["Running Shoes", "sports", 45, 1, "approved"],
      ["Classic Novels Set", "books", 30, 10, "approved"],
      ["Mechanical Keyboard", "electronics", 75, 2, "pending"],
      ["Winter Coat", "fashion", 90, 3, "blocked"],
      ["Yoga Mat", "sports", 15, 0, "approved"],
      ["Bookshelf", "home", 60, 6, "pending"],
    ];
    const live = [];
    for (const [k, [name, category, price, age, status]] of extra.entries()) {
      const at = daysAgo(25 - k * 3);
      const doc = await Product.create({
        ...base,
        seller: k % 2 ? users.seller._id : users.buyer._id,
        name,
        description: `${name} in good condition. Pickup or local delivery available.`,
        price,
        category,
        age,
        status,
        createdAt: at,
        updatedAt: at,
      });
      if (status === "approved") live.push(doc);
    }
    // Spread some bids over the last weeks so dashboard trends have data.
    for (let n = 0; n < 12; n++) {
      const product = live[n % live.length];
      const buyer = String(product.seller) === String(users.buyer._id) ? users.seller : users.buyer;
      const at = daysAgo((n * 5) % 27);
      await Bids.create({
        product: product._id,
        seller: product.seller,
        buyer: buyer._id,
        bidAmount: Math.round(product.price * (0.7 + (n % 4) * 0.08)),
        message: "Is this still available? I can collect this week.",
        mobile: "+1 555 01" + String(10 + n),
        createdAt: at,
        updatedAt: at,
      });
    }
  }

  await Bids.create({
    product: products.camera._id,
    seller: users.seller._id,
    buyer: users.buyer._id,
    bidAmount: 600,
    message: "Would you take 600 if I pick it up today?",
    mobile: "+1 555 0100",
  });
  await Notification.create({
    user: users.seller._id,
    title: "New bid received",
    message: `${users.buyer.name} placed a bid of 600 on "Mirrorless Camera".`,
    onClick: "/my-products",
  });

  return { users, products };
}

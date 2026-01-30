const {
  AdminModel: adminModel,
  MenuModel: menuModel,
  UserModel: usersModel,
} = require("@sms/shared");

const getMenus = async (req, res) => {
  try {
    const { schoolId, role } = req.params;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required to fetch menus",
      });
    }

    const user = await usersModel.findOne({ role });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const accessTokens = [user.role].filter(Boolean);

    const menus = await menuModel.find(
      {
        menuAccessRoles: { $in: accessTokens },
        schoolId: schoolId,
        status: "active",
        deactivatedRoles: { $nin: accessTokens },
      },
      { menuAccessRoles: 0 },
    );

    // Sort in memory because we need to find the specific order code in the array relevant to the role
    let prefix = "M";
    const r = role.toLowerCase();
    if (r === "super_admin") prefix = "SA";
    else if (r === "school_admin" || r === "sch_admin") prefix = "A";
    else if (r === "teacher") prefix = "T";
    else if (r === "parent") prefix = "P";
    else if (r === "student") prefix = "S";

    const getRoleOrder = (menu) => {
      const orders = Array.isArray(menu.menuOrder)
        ? menu.menuOrder
        : [menu.menuOrder];
      // Find code starting with prefix
      const code = orders.find((o) => String(o).startsWith(prefix));
      return code || "Z99999"; // Fallback to end if no code found
    };

    const sortedMenus = menus.sort((a, b) => {
      const orderA = getRoleOrder(a);
      const orderB = getRoleOrder(b);
      return orderA.localeCompare(orderB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return res.status(200).json({
      success: true,
      message: "Menus fetched successfully",
      data: sortedMenus,
      count: sortedMenus.length,
    });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menus",
      error: error.message,
    });
  }
};

module.exports = {
  getMenus,
};

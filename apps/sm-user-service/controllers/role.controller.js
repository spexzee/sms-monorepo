const { RoleModel } = require("@sms/shared/models");

/**
 * GET /roles
 * Get all roles (optionally filtered by isActive)
 */
exports.getAllRoles = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === 'true' ? { isActive: true } : {};
    
    const roles = await RoleModel.find(filter).sort({ roleName: 1 });
    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
      error: error.message,
    });
  }
};

/**
 * GET /roles/:roleCode
 * Get a single role by its code
 */
exports.getRoleByCode = async (req, res) => {
  try {
    const { roleCode } = req.params;
    const role = await RoleModel.findOne({ roleCode: roleCode.toLowerCase() });
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: `Role not found with code: ${roleCode}`,
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch role",
      error: error.message,
    });
  }
};

/**
 * POST /roles
 * Create a new role
 */
exports.createRole = async (req, res) => {
  try {
    const roleData = req.body;
    
    // Check if role already exists
    const existingRole = await RoleModel.findOne({ roleCode: roleData.roleCode.toLowerCase() });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: `Role with code '${roleData.roleCode}' already exists`,
      });
    }

    const newRole = await RoleModel.create(roleData);
    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: newRole,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create role",
      error: error.message,
    });
  }
};

/**
 * PUT /roles/:id
 * Update an existing role
 */
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedRole = await RoleModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedRole) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update role",
      error: error.message,
    });
  }
};

/**
 * DELETE /roles/:id
 * Delete a role (or deactivate it)
 */
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    if (permanent === 'true') {
      const deletedRole = await RoleModel.findByIdAndDelete(id);
      if (!deletedRole) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }
    } else {
      const deactivatedRole = await RoleModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
      if (!deactivatedRole) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: permanent === 'true' ? "Role deleted permanently" : "Role deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete role",
      error: error.message,
    });
  }
};

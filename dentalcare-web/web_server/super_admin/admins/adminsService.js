import { supabaseAdmin } from "../../shared/supabaseClient.js";
import { generateTempPassword } from "../../nodemailer/passwordGenerator.js";
import { generateOtp, sendOtpEmail } from "../../nodemailer/emailOtpService.js";

export const getAdminsList = async () => {
  try {
    const { data, error } = await supabaseAdmin.from("admin_list").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const mapped = data.map(admin => ({
      id: admin.id,
      name: admin.full_name || "Unassigned",
      dateOfBirth: "N/A", 
      age: 0,
      sex: "N/A",
      contactNumber: admin.phone_number || "N/A",
      email: admin.email,
      branch: admin.branch || "All",
      status: admin.is_active ? "Active" : "Inactive",
      isProfileCompleted: admin.is_verified,
      adminType: admin.admin_type
    }));
    return { success: true, statusCode: 200, data: mapped };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

export const createAdminAccount = async (payload) => {
  try {
    const tempPassword = generateTempPassword();
    const otp = generateOtp();

    const branchesString = payload.branches && payload.branches.length > 0 
      ? payload.branches.join(" | ") 
      : "Unassigned";

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: payload.email,
      password: tempPassword,
      email_confirm: true,
    });
    if (authError) throw authError;

    const { data: adminData, error: dbError } = await supabaseAdmin.from("admin_list").insert({
      id: authData.user.id, 
      full_name: payload.name,
      email: payload.email,
      phone_number: payload.contactNumber,
      branch: branchesString,
      admin_type: "admin",
      is_active: true,
      is_verified: false, 
      verification_otp: otp
    }).select().single();
    if (dbError) throw dbError;

    await sendOtpEmail({
      email: payload.email,
      fullName: payload.name,
      otp: otp,
      role: "admin",
      tempPassword: tempPassword 
    });

    return { success: true, statusCode: 201, data: adminData };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};

export const updateAdminStatus = async (id, isActive) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("admin_list")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      statusCode: 200,
      data: {
        ...data,
        status: data.is_active ? "Active" : "Inactive",
      },
    };
  } catch (error) {
    return { success: false, statusCode: 500, message: error.message };
  }
};
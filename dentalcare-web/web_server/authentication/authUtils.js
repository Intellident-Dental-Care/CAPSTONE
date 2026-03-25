import { supabaseAdmin, supabaseAuth } from "../shared/supabaseClient.js";
import { signToken, signTokenWithExpiry, verifyToken } from "../shared/token.js";

export { supabaseAdmin, supabaseAuth, signToken, signTokenWithExpiry, verifyToken };

export default {
  supabaseAdmin,
  supabaseAuth,
  signToken,
  signTokenWithExpiry,
  verifyToken,
};

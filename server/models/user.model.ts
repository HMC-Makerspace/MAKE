import mongoose from "mongoose";
import type { TUser } from "common/user";

// uuid: str
// name: str
// email: str
// cx_id: int
// role: str
// passed_quizzes: Dict[str, str]
// proficiencies: Union[List[str], None] = None
// files: Union[List[object], None] = None
// availability: Union[List[List[bool]], None] = None
// new_steward: Union[bool, None] = None
// certifications: Union[Dict[str, float], None] = None

/**
 * See {@link TUser} documentation for type information.
 */
export const User = new mongoose.Schema<TUser>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    college_id: { type: Number, required: true },
    role: { type: String, required: true },
    certifications: {
        type: Map, // Maps strings to
        of: Number,
        required: true,
    },
});

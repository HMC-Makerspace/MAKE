import mongoose, { mongo, SchemaType } from "mongoose";
import { TUser } from "../../common/user";

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

const User = new mongoose.Schema<TUser>({
    name: { type: String, required: true },
    email: { type: String, required: true },
    cx_id: { type: Number, required: true },
    role: { type: String, required: true },
    passed_quizzes: {
        type: Map, // Maps strings to
        of: Number,
        required: true,
    },
    proficiencies: {
        type: [String],
        required: false,
    },
    files: {
        type: 
    }
});

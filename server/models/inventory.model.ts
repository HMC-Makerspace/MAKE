import mongoose, { mongo, SchemaType } from "mongoose";
import type { TInventoryItem, TLocation } from "common/inventory";

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

const Location = new mongoose.Schema<TLocation>({
    room: { type: String, required: true },
    quantity: { type: Number, required: true },
    container: { type: String, required: false },
    specific: { type: String, required: false },
});

export const InventoryItem = new mongoose.Schema<TInventoryItem>({
    uuid: { type: String, required: true },
    name: { type: String, required: true },
    long_name: { type: String, required: false },
    role: { type: String, required: true },
    access_type: { type: Number, required: true },
    // locations: {
    //     type: ,
    //     required: false,
    // },
    // files: {
    //     type:
    // }
});

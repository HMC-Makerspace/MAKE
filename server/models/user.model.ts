import mongoose, { mongo } from "mongoose";

interface IUser {
    uuid: string
    name: string
    email: string
    cx_id: number
    role: string
    passed_quizzes: Dict[str, str]
    proficiencies: Union[List[str], None] = None
    files: Union[List[object], None] = None
    availability: Union[List[List[bool]], None] = None
    new_steward: Union[bool, None] = None
    certifications: Union[Dict[str, float], None] = None
}

const User = new mongoose.Schema({

})
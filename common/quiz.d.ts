import { QUIZ_IDS } from "./config";
import { UnixTimestamp } from "./global";

/**
 * TQuiz - Descriptive information about a Google Form quiz
 * @property uuid - unique id
 * @property name - short name for the quiz
 * @property description - what the quiz is for
 */
export type TQuiz = {
    gid: string;
    name: string;
    description: string;
};

/**
 * TQuizResponse - Object for a user's quiz result
 * @property gid - google sheet id of the quiz
 * @property name - name of the user who took the quiz
 * @property email - the email of the user who took the quiz
 * @property timestamp - the timestamp of when the quiz was taken
 * @property CX ID - the CX ID (college id) of the user who took the quiz
 * @property score - the score of the quiz
 * @property passed - whether or not the user passed the quiz
 */
export type TQuizResponse = {
    gid: (typeof QUIZ_IDS)[number];
    name: string;
    email: string;
    timestamp: UnixTimestamp;
    cx_id: number;
    score: number;
    passed: boolean;
};

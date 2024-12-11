/** 
 * Shift - Object to store information about all shifts
 * @property timestart - the start time of a shift
 * @property timeend - the end time of the shift
 * @property day - the weekday of the shift
 * @property stewards - the stewards working that shift (contained in a list)
*/
export type Shift = {
    timestart: number,
    name: string;
    email: string;
    timestamp: number;
}
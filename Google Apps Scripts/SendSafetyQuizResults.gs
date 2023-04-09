const GENERAL = "66546920";
const LASER3D = "1524924728";
const SPRAY_PAINT = "1841312496";
const COMPOSITE = "913890505";
const WELDING = "482685426";
const STUDIO = "2079405017";
const WATERJET = "2100779718";

function sendQuizResult(e) {
    // Set logger
    Logger.log("sendQuizResult() called");
    // Iterate through all values in e
    for (var key in e) {
        Logger.log(key + " = " + e[key]);
    }

    // Determine which quiz sent this result
    // by seeing which sheet it was put in
    var sheet_id = e.range.getGridId();

    // Then get quiz result w/ timestamp, name, college email, college id, and score
    var response = [namedValues["Timestamp"], namedValues["Name"], namedValues["College ID Number"], namedValues["College Email"]];

    // Post to https://make.hmc.edu/api/v1/auth/add_quiz_response
    var options = {
        "method": "post",
        "payload": {
            "quiz_id": sheet_id,
            "response": response
        }
    };

    var response = UrlFetchApp.fetch("https://make.hmc.edu/api/v1/auth/add_quiz_response", options);
    Logger.log(response);    
}

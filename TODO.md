# v3 TODO:
---
## Basic Setup
- [ ] Install TS, React, Express, CORS, MongoDB, Pino, Jest, Redux, Tailwind, and NextUI
	- [ ] TSconfig needs to be setup properly for compiling to function well
		- [ ] https://www.typescriptlang.org/tsconfig/#outFile
	- [ ] Express should at least be setup with a main index page
		- [ ] We also need to consider how we want API routes to be organized
		- [ ] Routes should be easily accessible from everywhere
	- [ ] Mongo needs to be setup and tested with some basic routes
		- [ ] All route pages should be able to import a type-defined `db` 
		- [ ] https://medium.com/@it.ermias.asmare/part-one-setting-up-express-typescript-mongodb-b77ed847b094
		- [ ] https://www.mongodb.com/resources/languages/mongodb-with-nodejs
	- [ ] Redux is setup using https://redux.js.org/usage/configuring-your-store, which is based off of this introduction https://redux.js.org/tutorials/fundamentals/part-5-ui-react
- [ ] Tailwind has a lot of config options that can be setup to define theme colors, which is something we care about being modifiable for this project
  - [ ] https://tailwindcss.com/docs/configuration
- [ ] NextUI is a configurable library based on Framer Motion and Tailwind, installation found here: https://nextui.org/docs/guide/installation


## DB Schema DIFF:
\* = types that are not actually stored in the db as a unique collection but are subparts of other objects

### APIKeys
- [x] Remove `APIKeys` in favor of user roles with API scopes

### Area
- [x] \* Add `Document` - An informational document (manual, policy, etc)
  - name
  - link

- [x] \* Add `MachineStatus` - The status of an individual machine of a certain type
  - `status` - the current status of the machine, one of `OFFLINE`, `ONLINE`, `FLAGGED_FOR_REPAIR`, or `IN_REPAIR` (members of the `MACHINE_STATUS_TYPE` enum)
  - `available` - A boolean for whether the individual machine is available (not reserved)
  - `message` - An optional string describing the current status

- [x] \* Add `MachineStatusLog` - A log of the current statuses of all machines for a given type
  - `timestamp` - The timestamp of the log
  - `statuses` - A list of `MachineStatus`

- [x] Add `Machine` - A type of machine in an area
  - `uuid` - a unique identifier
  - `name` - The name of the machine
  - `description` - An optional string describing the machine
  - `images` - File UUIDs of images of this machine
  - `count` - the total number of this machine in the area
  - `current_statuses` - a list of `MachineStatus` that is the current status of all individual machines of this type
  - `status_logs` - a list of `MachineStatusLog` that contains the history of all status changes to the machines of this type
  - `documents` - an optional list of `Document` for manuals/policies about the machine

- [x] \* Add `AreaStatus` - The status of an area
  - `available` - A boolean for whether the area is available (not reserved)
  - `message` - An optional string describing the current status of the area

- [x] \* Add `AreaStatusLog` - A log of the current status of the area
  - `timestamp` - The timestamp of the log
  - `status` - An instance of `AreaStatus`

- [ ] Add `Area`
  - `uuid` - a unique identifier
  - `name` - the name of the area
  - `description` - An optional string description of what the area is for or contains
  - `documents` - an optional list of `Document` for policies/information about the area
  - `equipment` - an optional list of `Machine` uuids that are in this area
  - `current_status` - An `AreaStatus` indicating the current availability of the area
  - `status_logs` - A list of `AreaStatusLog` that contains the history of availability for the given area.

### Certification
- [x] Add `CertificationType`
  - add `uuid` - The uuid of this certification type
  - add `name` - The name of this given certification type (quiz, proficiency, etc.)
  - add `description` - The optional description of what this certification type is

- [x] Modify `Certification` (which also now encompasses proficiencies and quizzes):
  - add `max_level` - A number for the maximum level of this certification
  - add `color` - A color that this certification can be displayed as
  - add `type` - A uuid of a certification type stored in the DB
  - modify `description` to be an optional string
  - keep `uuid`, `name`, and `seconds_valid_for`


- [x] \* Add `Certificate` (stored in each `User`)
  - add `certification_uuid` - The uuid of a `Certification` object in the DB that stores info about this certificate
  - add `level` - The level of proficiency this user has in the given certification
  - add `timestamp_granted` - The timestamp this certificate was granted to the user
  - add `timestamp_expires` - The timestamp this certificate expires, calculated as `timestamp_granted + (parent certification).seconds_valid_for`

### Checkout
- [x] \* Add `CheckoutItem` - A single item in a checkout
  - `item_uuid`
  - `quantity`
  - `location_index` - An index of which location of the InventoryItem this checkout was taken from.

- [x] Modify `Checkout`
  - [ ] Change `items` to instead be a list of `CheckoutItem`
  - [ ] remove `renewals_left`

### Config
- [x] Add `Config`, a configuration object for generally modifiable states for the entire site

### File
- [x] Combine `UserFile` and `ServerFile` into a unified `File`
  - `uuid`
  - `name`
  - `path`
  - `timestamp_upload`
  - `timestamp_expires`?
  - `size`
  - `user_uuid`?

### Inventory
- [x] Modify `InventoryItem`:
  - Store quantity as number >=0 or LOW (-1) or HIGH (-2), **no more medium**
  - rename `certifications` to `required_certifications`
  - add `required_roles` - An optional list of UserRole UUIds who are allowed to checkout this item. If not present, anyone can checkout the item
  - Remove access type levels 4 and 5 in favor of `required_certifications` and `required_roles`

- [x] \* Add `RestockRequestStatusLog`
  - `timestamp` - the timestamp of the log
  - `status` - the new status of the request, one of `PENDING_APPROVAL`, `DENIED`, `APPROVED_WAITING`, `APPROVED_ORDERED`, or `RESTOCKED`,
  - `message` - An optional string message describing the updated status

- [x] Modify `RestockRequest`
  - replace `item` with `item_uuid`, the uuid of the item being requested
  - replace `quantity` with `quantity_requested`, an optional number of the item requested to purchase
  - add `current_quantity`, an automatically assigned quantity of the item at the time the request was submitted
  - rename `user_uuid` to `requesting_user`
  - remove `timestamp_sent`, `timestamp_completed`, `is_approved`, and `completion_note` in favor of:
    - `current_status`, the current status of the request, one of `PENDING_APPROVAL`, `DENIED`, `APPROVED_WAITING`, `APPROVED_ORDERED`, or `RESTOCKED`,
    - `status_logs`, a list of `RestockRequestStatusLog` that contains the history of all status updates for this request.

### IPLog
- [x] Modify `IPLog`
  - add `request`, the HTTP request object associated with this site call

### Redirect
- [x] Since `IPLog` got modified, redirect did too, since it contains a list of `IPLog` objects

### Reservation
- [x] Add `Reservation`
  - `uuid`
  - `type` - one of `ITEM`, `MACHINE`, or `LOCATION`
  - `reserved_uuid` - UUID of the item, machine, or location being reserved
  - `user_uuid` - UUID of the user reserving
  - `timestamp_start`
  - `timestamp_end`
  - `seconds_recurring` - An optional number of seconds between recurrences of this reservation. If not present, the reservation does not recur.
  - `num_recurrences` - An optional number of times for this reservation to recur. If `seconds_recurring` is not defined, this property is ignored. If `seconds_recurring` is defined but `num_recurrences` is not, the reservation recurs indefinitely.
  - `purpose` - optional string description of the purpose for/person reserving

### Schedule
- [x] Add `Schedule`: An object that stores all shifts for a certain timeframe
  - add `timestamp_start` - A unix timestamp for when this schedule becomes active
  - add `timestamp_end` - A unix timestamp for when this schedule becomes inactive
  - add `shifts` - A list of Shift objects for this schedule
  - add `alerts` - A list of Alert objects that occurred during this schedule

- [x] \* Change `Status` to `Alert` (now stored in Schedule):
  - add `timestamp_start`, the time to start showing this motd
  - add `timestamp_end`, the time to 
  - add `header`, a string that is a header for the alert message
  - add `message`, the actual alert message
  - add `default`, an optional boolean to indicate that this is a default alert
    - If there is no active alert (no timestamps with an end time before the current time), a randomly selected alert with the `default` tag will be shown

### Shift
- [x] Modify `Shift`:
  - modify `timestamp_start` to be `ms_start` - the number of milliseconds after midnight that this shift starts
  - modify `timestamp_end` to be `ms_end` - the number of milliseconds after midnight that this shift ends
  - modify `day` to be `day_index` - the 0-indexed day that this shift occurs (0 = Sunday)
  - modify `stewards` to be `assignee` - the UUID of a single steward that is on this shift (there could be multiple shift objects with the same `ms_start` and `ms_end` but different assignees)
  - add `history` - A list of `ShiftEvent` objects for this shift

- [x] \* Modify `ShiftChange` to be `ShiftEvent` (stored in a specific `Shift`):
  - change `is_drop` and `is_pickup` to a `type` variable with enum options of `DROP`. `PICKUP`, and `CHECKIN`
  - change `date`, `timestamp_start`, and `timestamp_end` to be:
    - `timestamp` - The timestamp this shift event was triggered
    - `shift_date` - The date (timestamp) of the shift that this event occurred on
  - Rename `steward` to `initiator`
  

### User
- [x] Add `UserRole`: A specific user role
  - add `uuid` - The uuid of this user role
  - add `title` - The title of this role
  - add `description` - The optional description of how this role works
  - add `color` - A color to display for this role
  - add `scope` - A list of API scopes that users with this role can access
  - add `default` - A boolean for whether the given role is a default role to apply to all new users

- [x] \* Add `UserRoleLog`
  - `role_uuid` - The uuid of a `UserRole`
  - `timestamp_gained` - The timestamp the user gained this UserRole
  - `timestamp_revoked` - The optional timestamp of when the user lost this role. If not present, the user actively has this role.

- [x] \* Add `UserAvailability` - a single day of availability for a user
  - `day` - the 0 indexed day
  - `availability` - A list of objects containing `ms_start` and a `ms_end` properties that are pairs of start and end times (in milliseconds after midnight) that this user is available on this day

- [x] Modify `User`:
  - rename `cx_id` -> `college_id`
  - remove `role` in favor of:
    - `active_roles` - A list of `UserRoleLogs` that the user current has
    - `past_roles` - A list of past roles the user no longer has
  - modify `passed_quizzes`, `proficiencies`, and `certifications` to be just `certificates`
    - Stored as a list of `Certificate` objects
  - modify `files` to be a list of File UUIDs
  - modify `availability` to be a list of `UserAvailability` objects.

### Workshop
- [x] Modify `Workshop`
  - modify `instructors` to be a list of User UUIDs instead of a string name
  - add `support_instructors`, an optional list of user UUIDs who are facilitating the instructors with the workshop
  - remove `is_live`
  - rename `is_live_timestamp` to `timestamp_public`
  - modify `required_quizzes` to be `required_certifications`, a list of Certification UUIDs that are required to attend this workshop
  - make `capacity` optional, if not present has no capacity (like a public event)
  - modify `rsvp_list` to be a dictionary of User UUIDs to the timestamp they RSVP'd for the workshop
  - make `photos` a list of `File` uuids (though it might have been this already)
  - make `description` optional
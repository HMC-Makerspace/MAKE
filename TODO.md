# v3 TODO:
### Basic Setup
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


### DB Schema DIFF:
\* = types that are not actually stored in the db as a unique collection but are subparts of other objects
- [ ] `ApiKey`, `UserFile`, and `ServerFile` are still a WIP, and both `UserRole` and ``CertificationType` are subject to change soon

- [x] Modify `InventoryItem`:
  - Store quantity as number >=0 or LOW (-1) or HIGH (-2), **no more medium**

- [ ] Modify `User`:
  - rename `cx_id` -> `college_id`
  - modify `role` to be an index of a specific `UserRole`
  - modify `passed_quizzes`, `proficiencies`, and `certifications` to be just `certifications`
    - Stored as a list of `Certificate` objects

- [ ] \* Add `Certificate` (stored in each `User`)
  - add `cert_uuid` - The uuid of a `Certification` object stored in the DB that stores info about this certificate
  - add `level` - The level of proficiency this user has in the given certification
  - add `timestamp_granted` - The timestamp this certificate was granted to the user
  - add `timestamp_expires` - The timestamp this certificate expires

- [ ] Modify `Certification` (which also now encompasses proficiencies and quizzes):
  - add `min_level` - A number for the minimum level of this certification
  - add `max_level` - A number for the maximum level of this certification
  - add `color` - A color that this certification can be displayed as
  - add `type` - An index of a certification type stored in the DB

- [ ] Add `CertificationType`
  - add `index` - The index of this certification type (auto incremented)
  - add `name` - The name of this given certification type (quiz, proficiency, etc.)
  - add `description` - The description of what this certification type describes

- [ ] Add `UserRole`: A specific user role
  - add `index` - The index of this user role (automatically generated in order)
  - add `title` - The title of this role
  - add `description` - The description of how this role works
  - add `color` - A color to display for this role

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

- [x] Add `Machine`:
  - uuid
  - name
  - description
  - image
  - count
  - online
  - manual_link

- [x] Add `Area`
  - uuid
  - name: string
  - description?: string
  - documents?: { name: string, link: string }
  - equipment?: machine uuids[]

- [x] Add `Reservation`
  - `uuid`
  - `type` - one of `ITEM`, `MACHINE`, or `LOCATION`
  - `reserved_uuid` - UUID of the item, machine, or location being reserved
  - `timestamp_start`
  - `timestamp_end`
  - `purpose` - optional string description of the purpose for/person reserving
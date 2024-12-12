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
- Items:
  - Store quantity as number >=0 or LOW (-1) or HIGH (-2), **no medium**
- User:
  - rename `cx_id` -> `college_id`
  - add `department` - a new optional string datapoint that states what department the user works for
  - modify `passed_quizzes`
    - Quizzes are now stored like certifications in the database, to be more customizable
    - So, users now store a dictionary of quiz DB UUIDs (which will still be GIDs) to the timestamp it was completed
  - modify `proficiencies`
    - Proficiencies are also now stored like certifications in the DB
    - Users store a dictionary of proficiency UUIDs to a Proficiency Level (1 - basic, or 2 - highly proficient)
  - 
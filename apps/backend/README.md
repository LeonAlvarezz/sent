## Express Template
This project is my take on an Express.js backend template, it designed to be as simple, minimal, and easy to pick up as possible.

I will give some detail on how it works, why I choose a certain things and some instruction on how to get started. Keep in mind that since Express is extremely unopinionated,  Of course, you’re free to tweak or replace anything,fork it, adapt it, and make it yours.
If you spot areas for improvement, feel free to open a PR. 

I hope this project can help you get start on your project, no matter if you are a senior or someone who just getting started. 🚀

## Project Architecture
The structure of the project is heavily inspired by NestJS, since I really enjoyed how each feature is organized into it own folder. For example: If I'm working on a auth feature, I can put its service, controller, repository into it own folder called "auths". 

In my opinion, In order to make the system robust and easy to use, you will need to set up a few thing: 
- Error Middleware
- Error Exception
- Boostrap or loader
- Input Validation
- Authentication
  
In this template, I've already have all of these thing set in place, of course, you can custom these thing to however you like.

Initially, I wanted to write raw SQL for this project. However, I just find it to be repetitive and extremely prone to failure. So, I opt to use ORM instead, specifically __Drizzle__. So __you will need some basic knowledge__ on how to use Drizzle. You read the docs [here](https://orm.drizzle.team/docs/get-started)

## Authentication
For authentication, I'm not quite fond of JWT as I prefer Session all the way, especially with http-only cookies. I've always love to roll my own auth, but recently I found [Better Auth](https://www.better-auth.com/) to be extremely good. As it handle almost everything that's hectic with rolling your own auth. My recommendation is, you should start with rolling your own auth, once you know the in and out and familliar with it, then use Better Auth.

## Set up 
This project utilizes **Cloudflare D1** (SQLite) with **Drizzle ORM**. No external database or Docker container is required. Local development leverages Wrangler's local D1 simulation out-of-the-box.

Migrate the database by running:
```bash
bun db:migrate
```
And then, seed the necessary data into the database:
```bash
bun db:seed
```
Then, it is done. You can now run the backend with:
```bash
bun dev
```

# Data Migration
Migration is a way for us to easily track our DB configuration (Read/Write). So each time you update the schema file, you can run: 
```bash
bun db:push
```
It will immediately update the db without generating a migration file. Once you feel confident that everything is good to go, you can run:

```bash
bun db:migrate --name='{MIGRATION_NAME}'
```
It will generate a migration history record file. This way if we onboard someone to the project, they just need to run migrate cli and it will set up the db for them. 

Whenever you need to generate a migration record, it's recommended to pull the code to the latest version then generate to prevent data drift.